import { TooltipProvider } from '@radix-ui/react-tooltip';
import './App.css';
import { KeywordMapEditor } from './components/quick-links-map';

function App() {
  return (
    <>
      <TooltipProvider>
        <KeywordMapEditor></KeywordMapEditor>
      </TooltipProvider>
    </>
  )
}

export default App
