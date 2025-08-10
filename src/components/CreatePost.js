import React, { useState, useEffect } from 'react';
import './CreatePost.css';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const components = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter style={coldarkDark} language={match ? match[1] : ''} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

const CreatePost = ({ isAuth }) => {
  const [title, setTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const navigate = useNavigate();

  const createPost = async () => {
    if (!auth.currentUser) {
      console.error("ユーザーがログインしていません。");
      navigate("/login");
      return;
    }

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      await addDoc(collection(db, 'posts'), {
        title: title,
        postText: postText,
        category: category,
        tags: tagsArray,
        author: {
          username: auth.currentUser.displayName,
          id: auth.currentUser.uid
        },
        createdAt: serverTimestamp()
      });
      navigate("/");
    } catch (error) {
      console.error("記事の投稿に失敗しました: ", error);
    }
  };

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  return (
    <div className='CreatePostPage'>
      <div className='PostContainer'>
        <h1>記事を投稿する</h1>
        <div className='inputGroup'>
          <label>タイトル</label>
          <input
            type="text"
            placeholder='タイトルを入力してください'
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />
        </div>
        <div className='inputGroup'>
          <label>カテゴリ</label>
          <input
            type="text"
            placeholder='例: フロントエンド, バックエンド'
            onChange={(e) => setCategory(e.target.value)}
            value={category}
          />
        </div>
        <div className='inputGroup'>
          <label>タグ (カンマ区切り)</label>
          <input
            type="text"
            placeholder='例: React, Firebase, CSS'
            onChange={(e) => setTags(e.target.value)}
            value={tags}
          />
        </div>
        <div className='inputGroup'>
          <label>投稿内容 (Markdown形式で記述)</label>
          <textarea
            placeholder='投稿内容をMarkdown形式で記入してください'
            onChange={(e) => setPostText(e.target.value)}
            value={postText}
          ></textarea>
        </div>
        <div className="buttonGroup">
            <button className='postButton' onClick={createPost}>投稿する</button>
            <button className='previewButton' onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'プレビューを閉じる' : 'プレビュー'}
            </button>
        </div>

        {showPreview && (
          <div className='markdownPreview'>
            <h2>プレビュー</h2>
            <div className='previewContent'>
              <ReactMarkdown components={components}>{postText}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;