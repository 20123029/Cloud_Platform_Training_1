import { collection, deleteDoc, doc, getDocs, query, orderBy, where, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import "./Home.css";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link, useNavigate } from "react-router-dom";

const components = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={coldarkDark}
        language={match ? match[1] : ''}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

const Home = ({ isAuth }) => {
  const [postLists, setPostList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [tagAdmins, setTagAdmins] = useState({});
  const [allTags, setAllTags] = useState([]);
  const navigate = useNavigate();

  // Fetch posts and extract unique tags
  useEffect(() => {
    const getPostsAndTags = async () => {
      const postsCollectionRef = collection(db, "posts");
      const q = query(postsCollectionRef, orderBy("createdAt", "desc"));
      const data = await getDocs(q);
      const allPosts = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setPostList(allPosts);

      const uniqueTags = new Set();
      allPosts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => uniqueTags.add(tag));
        }
      });
      setAllTags(Array.from(uniqueTags));
    };
    getPostsAndTags();
  }, []);

  // Subscribe to tag admin changes
  useEffect(() => {
    if (allTags.length === 0) return;

    const unsubscribes = allTags.map(tag => {
      const tagAdminDocRef = doc(db, 'tag_admins', tag);
      return onSnapshot(tagAdminDocRef, (docSnap) => {
        setTagAdmins(prevAdmins => ({
          ...prevAdmins,
          [tag]: docSnap.exists() ? docSnap.data() : null,
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [allTags]);

  const handleDelete = async (id) => {
    const postToDelete = postLists.find(post => post.id === id);
    if (!isAuth || auth.currentUser?.uid !== postToDelete?.author.id) {
      alert("この投稿を削除する権限がありません。");
      return;
    }
    if (window.confirm("本当にこの投稿を削除しますか？")) {
      const postDoc = doc(db, "posts", id);
      await deleteDoc(postDoc);
      setPostList(prevPosts => prevPosts.filter(post => post.id !== id));
    }
  };

  const handleEdit = (id) => {
    navigate(`/editpost/${id}`);
  };

  const handleBecomeAdmin = async (tag) => {
    if (!isAuth || !auth.currentUser) {
      alert("ログインしてください。");
      return;
    }
    const tagAdminDocRef = doc(db, 'tag_admins', tag);
    try {
      await setDoc(tagAdminDocRef, {
        adminId: auth.currentUser.uid,
        adminName: auth.currentUser.displayName,
      });
      alert(`「${tag}」の管理者になりました。`);
    } catch (error) {
      console.error("管理者の設定に失敗しました: ", error);
      alert("管理者の設定に失敗しました。");
    }
  };

  const handleDeleteAdmin = async (tag) => {
    if (!isAuth || !auth.currentUser) {
      alert("ログインしてください。");
      return;
    }
    const currentAdmin = tagAdmins[tag];
    if (!currentAdmin || currentAdmin.adminId !== auth.currentUser.uid) {
      alert("あなたはこのタグの管理者ではありません。");
      return;
    }

    if (window.confirm(`「${tag}」の管理者を辞退しますか？`)) {
      const tagAdminDocRef = doc(db, 'tag_admins', tag);
      try {
        await deleteDoc(tagAdminDocRef);
        alert(`「${tag}」の管理者を辞退しました。`);
      } catch (error) {
        console.error("管理者の削除に失敗しました: ", error);
        alert("管理者の削除に失敗しました。");
      }
    }
  };

  const filteredPostLists = postLists.filter(post => {
    const categoryMatch = filterCategory ? post.category.toLowerCase().includes(filterCategory.toLowerCase()) : true;
    const tagMatch = filterTag ? post.tags && post.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())) : true;
    const searchMatch = searchTerm ?
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.postText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.author?.username && post.author.username.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return categoryMatch && tagMatch && searchMatch;
  });

  return (
    <div className='homePage'>
      <div className='searchFilterContainer'>
        <input
          type="text"
          placeholder="キーワード検索..."
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
        <input
          type="text"
          placeholder="カテゴリでフィルタ..."
          onChange={(e) => setFilterCategory(e.target.value)}
          value={filterCategory}
        />
        <input
          type="text"
          placeholder="タグでフィルタ..."
          onChange={(e) => setFilterTag(e.target.value)}
          value={filterTag}
        />
      </div>

      {filteredPostLists.map((post) => {
        const truncatedPostText = post.postText.length > 100
          ? post.postText.substring(0, 100) + "..."
          : post.postText;

        return (
          <div className='postContents' key={post.id}>
            <div className='postHeader'>
              <h1>{post.title}</h1>
              {post.category && <span className="postCategory">カテゴリ: {post.category}</span>}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="postTags">
                {post.tags.map((tag, index) => (
                  <div key={index} className="tagWithAdmin">
                    <span className="tagItem">#{tag}</span>
                    {tagAdmins[tag] && <span className="tagAdminName"> (管理者: @{tagAdmins[tag].adminName})</span>}
                  </div>
                ))}
              </div>
            )}
            <div className='postBodyContainer'>
              <ReactMarkdown components={components}>
                {truncatedPostText}
              </ReactMarkdown>
              {post.postText.length > 100 && (
                <Link to={`/post/${post.id}`} target="_blank" rel="noopener noreferrer" className="readMoreLink">
                  続きを読む
                </Link>
              )}
            </div>
            <div className='nameAndDeleteButton'>
              <h3>@{post.author?.username}</h3>
              {isAuth && post.author.id === auth.currentUser?.uid && (
                <div className="buttonContainer">
                  <button className="editButton" onClick={() => handleEdit(post.id)}>編集</button>
                  <button className="deleteButton" onClick={() => handleDelete(post.id)}>削除</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {filteredPostLists.length === 0 && (
        <p>該当する記事は見つかりませんでした。</p>
      )}

      <footer className="tagAdminSection">
        <h4>タグ管理者設定</h4>
        <div className="tagAdminList">
          {allTags.length > 0 ? allTags.map(tag => (
            <div key={tag} className="tagAdminListItem">
              <span className="tagName">#{tag}</span>
              <div className="adminInfo">
                {tagAdmins[tag] ? (
                  <span>管理者: @{tagAdmins[tag].adminName}</span>
                ) : (
                  <span>管理者がいません</span>
                )}
                {isAuth && (
                  <>
                    <button onClick={() => handleBecomeAdmin(tag)}>
                      {tagAdmins[tag] ? '管理者を変更' : '管理者になる'}
                    </button>
                    {tagAdmins[tag] && tagAdmins[tag].adminId === auth.currentUser?.uid && (
                      <button className="adminDeleteButton" onClick={() => handleDeleteAdmin(tag)}>
                        辞退する
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )) : <p>管理対象のタグがありません。</p>}
        </div>
      </footer>
    </div>
  )
};

export default Home;