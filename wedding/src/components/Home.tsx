
import { Link } from 'react-router-dom'
import pv from '../assets/pvpng.png'
import './home.css'


export const Home = () => {
  return (
	<div className='Home'>
		<article className='home-present'>
		<h2 className='fade-in-h1'>Let us present to you . . . </h2>

<h2 className='fade-in-h2'>Mr & Mrs Hillerud Ahlbäck!</h2>
		</article>
		

		<img className="fade-in-img" src={pv} alt="" />

<article className='home-goto'>
	
	<p>Go to:</p>
	<div className='link-holder'>
	<Link className="navBtn" to={"/greetings"}>Greetings</Link>
	<Link className="navBtn" to={"/album"}>Album</Link>
	</div>
	
</article>
		
	</div>
  )
}
