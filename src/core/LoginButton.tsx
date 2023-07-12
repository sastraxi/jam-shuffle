import { Auth } from "@supabase/auth-ui-react"
import { useSession } from "../state/app"
import { supabase } from "./supabase"
import { ThemeSupa } from "@supabase/auth-ui-shared"

const LoginButton = () => {
    const session = useSession()
    if (session) return null
    return (
        <Auth
            providers={["spotify"]}
            onlyThirdPartyProviders={true}
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providerScopes={{ "spotify": "user-library-read,playlist-read-private,playlist-read-collaborative" }}
        />
    )
}

export default LoginButton
