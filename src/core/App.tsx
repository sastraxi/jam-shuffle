import { useState, useEffect } from 'react'

import { Auth } from '@supabase/auth-ui-react'
import { Session, createClient } from '@supabase/supabase-js'
import { ThemeSupa } from '@supabase/auth-ui-shared'

import { useQuery } from "@tanstack/react-query";

import './App.css'
import Category from './Category'
import { SpotifyMe } from '../types/spotify';
import SingleIdea from '../prompts/SingleIdea';
import Settings from '../settings/Settings';

// Create a single supabase client for interacting with your database
const PUBLIC_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYmhjZ2ZueWtwdHZpZHJ6em9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYxMTM1NDQsImV4cCI6MjAwMTY4OTU0NH0.wli6p3Lx-99RAvTUz5qCD23JM1OTMB6NUiUAFlk2TkU"
const supabase = createClient('https://tmbhcgfnykptvidrzzop.supabase.co', PUBLIC_ANON_KEY)

async function signout() {
  const { error } = await supabase.auth.signOut()
}

const App = () => {
  const [session, setSession] = useState<Session | null>(null)

  const getUserProfile = async () => {
    if (!session) return null
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { "Authorization": `Bearer ${session.provider_token}` }
    })
    return res.json()
  }

  const { isLoading, error, data, isFetching } = useQuery<SpotifyMe>({
    queryKey: ["userProfile"],
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
  }, [session])

  if (!session) {
    return (<Auth
      providers={["spotify"]}
      onlyThirdPartyProviders={true}
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providerScopes={{ "spotify": "user-library-read,playlist-read-private,playlist-read-collaborative" }}
    />)
  }

  return (
    <>
      <Settings name={data?.display_name} onLogout={signout} session={session} />
      <Category
        category="single idea"
      />
      <SingleIdea />
    </>
  )
}

export default App
