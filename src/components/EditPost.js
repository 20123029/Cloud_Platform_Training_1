import React, { useState, useEffect } from 'react';
import './EditPost.css';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate, useParams } from "react-router-dom";
// Markdown preview imports
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

const EditPost = ({ isAuth }) => {
    const { postId } = useParams();
    const [title, setTitle] = useState('');
    const [postText, setPostText] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuth) {
            navigate("/login");
            return;
        }

        const getPost = async () => {
            setLoading(true);
            const postRef = doc(db, 'posts', postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists() && postSnap.data().author.id === auth.currentUser?.uid) {
                const postData = postSnap.data();
                setTitle(postData.title);
                setPostText(postData.postText);
                setCategory(postData.category);
                setTags(postData.tags ? postData.tags.join(',') : '');
            } else {
                console.error("投稿が存在しないか、編集権限がありません。");
                navigate("/");
            }
            setLoading(false);
        };

        getPost();
    }, [postId, isAuth, navigate]);

    const updatePost = async () => {
        if (!auth.currentUser) {
            console.error("ユーザーがログインしていません。");
            navigate("/login");
            return;
        }

        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const postRef = doc(db, 'posts', postId);

        try {
            await updateDoc(postRef, {
                title: title,
                postText: postText,
                category: category,
                tags: tagsArray,
                updatedAt: serverTimestamp()
            });
            navigate("/");
        } catch (error) {
            console.error("記事の更新に失敗しました: ", error);
        }
    };

    if (loading) {
        return <div className="loading">ロード中...</div>;
    }

    return (
        <div className='EditPostPage'>
            <div className='PostContainer'>
                <h1>記事を編集する</h1>
                <div className='inputGroup'>
                    <label>タイトル</label>
                    <input
                        type="text"
                        onChange={(e) => setTitle(e.target.value)}
                        value={title}
                    />
                </div>
                <div className='inputGroup'>
                    <label>カテゴリ</label>
                    <input
                        type="text"
                        onChange={(e) => setCategory(e.target.value)}
                        value={category}
                    />
                </div>
                <div className='inputGroup'>
                    <label>タグ (カンマ区切り)</label>
                    <input
                        type="text"
                        onChange={(e) => setTags(e.target.value)}
                        value={tags}
                    />
                </div>
                <div className='inputGroup'>
                    <label>投稿内容 (Markdown形式で記述)</label>
                    <textarea
                        onChange={(e) => setPostText(e.target.value)}
                        value={postText}
                    ></textarea>
                </div>
                <div className="buttonGroup">
                    <button className='updateButton' onClick={updatePost}>更新する</button>
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

export default EditPost;