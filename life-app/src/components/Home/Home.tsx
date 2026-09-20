import styles from './Home.module.css'
import HomeNavbar from '../Navbars/Home_navbar'
import { Link } from 'react-router-dom';


function Home() {
    return (
        <div className={styles.home_page}>
            <HomeNavbar />
            <div className={styles.content_card}>
                <Link to='/planner' className={styles.planner_card}>
                    <h1>Planner</h1>
                </Link>
            </div>
        </div>
    )
}

export default Home;