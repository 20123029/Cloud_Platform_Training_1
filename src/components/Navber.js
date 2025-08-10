import React from 'react';
import { Link } from 'react-router-dom';
import './Navber.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faFilePen, faArrowRightToBracket, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

const Navber = ({ isAuth }) => {
  return (
    <nav>
      <Link to="/" className="nav-home-link">
        <FontAwesomeIcon icon={faHouse} />
        ホーム
      </Link>
      <div className="nav-links">
        {!isAuth ? (
          <Link to="/login">
            <FontAwesomeIcon icon={faArrowRightToBracket} />
            ログイン
          </Link>
        ) : (
          <>
            <Link to="/createpost">
              <FontAwesomeIcon icon={faFilePen} />
              記事投稿
            </Link>
            <Link to="/logout">
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              ログアウト
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
export default Navber;