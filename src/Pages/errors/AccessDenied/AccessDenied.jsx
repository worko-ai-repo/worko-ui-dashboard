import { bg_plexus } from "@Assets";
import styles from "./accessdenied.module.scss";

const AccessDenied = () => {
  return (
    <div className={styles.main_Container}>
      <div className={styles.sub_Container}>
        <h1 className={styles.errorCode}>403</h1>
        <h3 className={styles.errorTitle}>Access Denied</h3>
        <p className={styles.errorMessage}>
          You don't have permission to view this page.
          <br />
          If you believe this is a mistake, please contact your administrator.
        </p>

        <button
          className={styles.goHomeBtn}
          onClick={() => (window.location.href = "/")}
        >
          Go Back Home
        </button>
      </div>

      <div className={styles.vector_start}>
        <div className={styles.vector_blob}></div>
        <img src={bg_plexus} alt="header_img" />
      </div>
    </div>
  );
};

export default AccessDenied;
