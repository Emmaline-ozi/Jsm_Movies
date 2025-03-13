import { useEffect, useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx';
import Mcard from './components/Mcard.jsx';
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}


const App = () => {
  const [debounceSearchTerm, setDebounceSearchTerm] = useState(''); //debounce- npm i react-use 
  const [searchTerm, setSearchTerm] = useState('');
   const [movieList, setMovieList] = useState([]);
   const [errorMessage, SetErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  
  //prevents too many API requests, by causing a delay
  useDebounce(() => setDebounceSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    SetErrorMessage('');

    try{
      const endpoint = query 
      ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      
      const response = await fetch(endpoint, API_OPTIONS);
      
      if(!response.ok){
        throw new Error("Failed to fetch data"); //manual error trials
      }
      const data = await response.json();

      if(data.response === 'False'){
        SetErrorMessage(data.Error || 'Failed to fetch data');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error){
      console.error(`Error fetching data: ${error}`);
      SetErrorMessage('Error fetching movies. PLease try again later.')
    }finally{
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }

  useEffect(() => {
      fetchMovies(debounceSearchTerm);
  }, [debounceSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
   <main>
      <div className="pattern" />

      <div className="wrapper" >
        <header>
          {/* <img src="/brand.svg" alt="" /> */}
          <h1> Find your favorite <span className="text-gradient" >Movies</span> </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2 className=''>All Movies</h2>
          {isLoading ? (
            <Spinner/>
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <Mcard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )}
        </section>
      </div>
   </main>
  )
}

export default App
