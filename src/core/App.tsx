import React, { useEffect, useState, lazy } from 'react'

import { Auth } from '@supabase/auth-ui-react'
import { createClient } from '@supabase/supabase-js'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useQuery } from "@tanstack/react-query";

import './App.css'
import CategorySelector from './CategorySelector'
import { SpotifyMe } from '../types/spotify';
import Settings from '../settings/Settings';
import { useCategory, useSession, useSetSession } from '../state/app';
import Spinner from '../components/Spinner';

import BackgroundVideo from '../assets/smoke-1080p-30fps.mp4'

const SingleIdea = lazy(() => import('../prompts/SingleIdea'));
const ContrastPrompt = lazy(() => import('../prompts/ContrastPrompt'));
const PlaylistPrompt = lazy(() => import('../prompts/PlaylistPrompt'));
const ChordsPrompt = lazy(() => import('../prompts/ChordsPrompt'));

// Create a single supabase client for interacting with your database
const PUBLIC_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYmhjZ2ZueWtwdHZpZHJ6em9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYxMTM1NDQsImV4cCI6MjAwMTY4OTU0NH0.wli6p3Lx-99RAvTUz5qCD23JM1OTMB6NUiUAFlk2TkU"
const supabase = createClient('https://tmbhcgfnykptvidrzzop.supabase.co', PUBLIC_ANON_KEY)

async function signout() {
  const { error } = await supabase.auth.signOut()
}

const App = () => {
  const session = useSession()
  const setSession = useSetSession()
  const category = useCategory()

  // FIXME: why does app re-render (once) when we click somewhere?
  const { isLoading, error, data, isFetching, isError } = useQuery<SpotifyMe>({
    queryKey: ["userProfile"],
    enabled: !!session?.user,
    queryFn: async () => {
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
    },
  })

  // initial load effects
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

  /////////////////////////////////////////////
  const [videoLoaded, setVideoLoaded] = useState(false)

  if (!session) {
    return (<Auth
      providers={["spotify"]}
      onlyThirdPartyProviders={true}
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providerScopes={{ "spotify": "user-library-read,playlist-read-private,playlist-read-collaborative" }}
    />)
  }

  const LOADING_SPINNER = (<Spinner size="40px" />)

  if (!data) {
    return LOADING_SPINNER
  }

  const backgroundVideo = <video
    id="background-video"
    src={BackgroundVideo}
    className={videoLoaded ? 'loaded' : ''}
    onLoadedData={() => setVideoLoaded(true)}
    autoPlay loop muted
  />

  return (
    <>
      { backgroundVideo }
      <div className="top-bar">
        <CategorySelector />
        <Settings name={data?.display_name} onLogout={signout} session={session} />
      </div>
      <React.Suspense fallback={LOADING_SPINNER}>
        { category.type === "single idea" && <SingleIdea /> }
        { category.type === "contrast" && <ContrastPrompt /> }
        { category.type === "playlist" && <PlaylistPrompt /> }
        { category.type === "chords" && <ChordsPrompt /> }
      </React.Suspense>
    </>
  )
}

export default App

