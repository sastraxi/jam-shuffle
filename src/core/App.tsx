import { useEffect } from 'react'

import { Auth } from '@supabase/auth-ui-react'
import { createClient } from '@supabase/supabase-js'
import { ThemeSupa } from '@supabase/auth-ui-shared'

import { useQuery } from "@tanstack/react-query";

import './App.css'
import CategorySelector from './CategorySelector'
import { SpotifyMe } from '../types/spotify';
import SingleIdea from '../prompts/SingleIdea';
import Settings from '../settings/Settings';
import { useCategory, useSession, useSetSession } from '../state/app';
import PlaylistPrompt from '../prompts/PlaylistPrompt';
import Spinner from '../components/Spinner';

import BackgroundVideo from '../assets/pexels-engin-akyurt-1722881-3840x2160-25fps.mp4'

// Create a single supabase client for interacting with your database
const PUBLIC_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYmhjZ2ZueWtwdHZpZHJ6em9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYxMTM1NDQsImV4cCI6MjAwMTY4OTU0NH0.wli6p3Lx-99RAvTUz5qCD23JM1OTMB6NUiUAFlk2TkU"
const supabase = createClient('https://tmbhcgfnykptvidrzzop.supabase.co', PUBLIC_ANON_KEY)

async function signout() {
  const { error } = await supabase.auth.signOut()
}

const App = () => {
  const session = useSession()
  const setSession = useSetSession()

  // FIXME: why does app re-render (once) when we click somewhere?

  const getUserProfile = async () => {
    if (!session) return null
    if (!session.provider_token) {
      // FIXME: are we supposed to save the provider_token / refresh token ourselves and re-add to session?
      signout()
      throw new Error("No provider_token in session")
    }
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { "Authorization": `Bearer ${session.provider_token}` }
    })
    if (!res.ok) throw res.json()
    return res.json()
  }

  const { isLoading, error, data, isFetching, isError } = useQuery<SpotifyMe>({
    queryKey: ["userProfile"],
    enabled: !!session?.user,
    queryFn: getUserProfile,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const category = useCategory()

  if (!session) {
    return (<Auth
      providers={["spotify"]}
      onlyThirdPartyProviders={true}
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providerScopes={{ "spotify": "user-library-read,playlist-read-private,playlist-read-collaborative" }}
    />)
  }

  if (!data) {
    return (<Spinner size="40px" />)
  }

  const backgroundVideo = <video
    id="background-video"
    src={BackgroundVideo}
    autoPlay loop muted
  />

  return (
    <>
      { backgroundVideo }
      <Settings name={data?.display_name} onLogout={signout} session={session} />
      <CategorySelector />
      { category.type === "single idea" && <SingleIdea /> }
      { category.type === "playlist" && <PlaylistPrompt /> }
    </>
  )
}

export default App
