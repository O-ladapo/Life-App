import infinityImg from '../assets/infinity.png'
import styles from './Home.module.css'

function Home() {
    return (
        <div className={styles.home_page}>
            <div className={styles.left_section}>
                <img src={infinityImg} width="221" height="134"/>
                <h1>Life App by Oladapo</h1>
            </div>
            <div className={styles.right_section}>
                <div className={styles.right_content}>
                      <h2>Home Page</h2>
                </div>
            </div>
        
          
        </div>
    )
}

export default Home;