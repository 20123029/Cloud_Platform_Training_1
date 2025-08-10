import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './PostDetail.css';

const components = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <SyntaxHighlighter style={coldarkDark} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code className={className} {...props}>
                {children}
            </code>
        );
    }
};

const PostDetail = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);

    useEffect(() => {
        const getPost = async () => {
            const postDocRef = doc(db, 'posts', postId);
            const postDoc = await getDoc(postDocRef);
            if (postDoc.exists()) {
                setPost(postDoc.data());
            } else {
                console.log('No such document!');
            }
        };
        getPost();
    }, [postId]);

    if (!post) {
        return <div>読み込み中...</div>;
    }

    return (
        <div className="postDetailPage">
            <div className="postDetailContainer">
                <h1>{post.title}</h1>
                <div className="postMeta">
                    <span>カテゴリ: {post.category}</span>
                    <span>投稿者: @{post.author.username}</span>
                </div>
                <div className="postTags">
                    {post.tags && post.tags.map((tag, index) => (
                        <span key={index} className="tagItem">#{tag}</span>
                    ))}
                </div>
                <div className="postBody">
                    <ReactMarkdown components={components}>
                        {post.postText}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;