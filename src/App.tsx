import './App.css'
import Category from './components/Category'
import SettingsButton from './components/SettingsButton'
import Prompt from './prompts/SingleIdea'

const App = () => {
  return (
    <>
      <SettingsButton />
      <Category
        category="single idea"
      />
      <Prompt />
    </>
  )
}

export default App
