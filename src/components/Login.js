import React from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ setIsAuth }) => {
  const navigate = useNavigate();
  const loginInWithGoogle = () => {
    signInWithPopup(auth, provider).then((result) => {
      localStorage.setItem('isAuth', true);
      setIsAuth(true);
      navigate('/');
    });
  };

  return (
    <div className="loginPage">
      <div className="loginBox">
        <h2>ITナレッジ共有へようこそ</h2>
        <p>Googleアカウントでログインして、<br />知識を共有し、チームの生産性を高めましょう。</p>
        <button className="login-with-google-btn" onClick={loginInWithGoogle}>
          Googleでログイン
        </button>
      </div>
    </div>
  );
};

export default Login