import { useState, useEffect } from 'react'

import { Auth } from '@supabase/auth-ui-react'
import { Session, createClient } from '@supabase/supabase-js'
import { ThemeSupa } from '@supabase/auth-ui-shared'

import { useQuery } from "@tanstack/react-query";

type SpotifyMeResponse = {
  display_name: string
  email?: string
  external_urls: {
    spotify: string
  }
  href: string
  id: string
  images: Array<{
    width: number | null
    height: number | null
    url: string
  }>
  type: "user"
  uri: string
}


import './App.css'
import Category from './components/Category'
import SettingsArea from './components/SettingsArea'
import Prompt from './prompts/SingleIdea'

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
      headers: { "Authorization": `Bearer ${session.provider_token}`}
    })
    return res.json()
  }

  const { isLoading, error, data, isFetching } = useQuery<SpotifyMeResponse>({
    queryKey: ["userProfile"],
    enabled: !!session && !!session.provider_token,
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
      <SettingsArea name={data?.display_name} onLogout={signout} />
      <Category
        category="single idea"
      />
      <Prompt />
    </>
  )
}

export default App