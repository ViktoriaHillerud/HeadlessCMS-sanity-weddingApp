
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App.tsx'
import './index.css'
import Greetings from './components/Greetings.tsx';
import { Home } from './components/Home.tsx';
import Album from './components/Album.tsx';

const router = createBrowserRouter([
	{
	  path: "/",
	  element: <App></App>,
	  children: [
		{
			path: "/",
			element: <Home />,
		  },
		{
		  path: "/greetings",
		  element: <Greetings />,
		},
		{
			path: "/album",
			element: <Album />,
		  },
	  ],
	},
  ]);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<RouterProvider router={router} />
  );
