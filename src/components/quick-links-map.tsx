import { useEffect, useState } from "react"
import { KeyValueInput } from "./keyword-entry"
import { Button } from "./ui/button"
import { Plus } from "lucide-react"

interface Entry {
  key: string
  value: string
}

export function KeywordMapEditor() {
  const [entries, setEntries] = useState<Entry[]>([])

  // Load from chrome.storage.local
  useEffect(() => {
    chrome.storage.sync.get("keywordMap", (result) => {
      const map = result.keywordMap as Record<string, string> || {}
      const initialEntries = Object.entries(map).map(([key, value]) => ({
        key,
        value,
      }))
      setEntries(initialEntries)
    })
  }, [])

  // Save updated map to storage
  const saveToStorage = (updated: Entry[]) => {
    const mapped = Object.fromEntries(updated.map(({ key, value }) => [key, value]))
    chrome.storage.sync.set({ keywordMap: mapped }, () => {
      console.log("Keyword map saved", mapped)
    })
    // Notify background to reload
    chrome.runtime.sendMessage({ type: "RELOAD_KEYWORD_MAP" })
  }

  const handleChange = (index: number, updatedEntry: Entry) => {
    const updated = [...entries]
    updated[index] = updatedEntry
    setEntries(updated)
    saveToStorage(updated)
  }

  const addNewEntry = () => {
    const updated = [...entries, { key: "", value: "" }]
    setEntries(updated)
    saveToStorage(updated)
  }

  const removeEntry = (index: number) => {
    entries.splice(index,1)
    const updated = [...entries];
    setEntries(updated)
    saveToStorage([...entries])
  }

  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <h2 className="text-lg font-semibold">⚡️ Links</h2>
      {entries.map((entry, index) => (
        <div key={index} className="rounded-[10px] shadow-md shadow-gray-300/50 dark:bg-[#333333] p-4">
          <KeyValueInput keyValue={entry} onChange={(e) => handleChange(index, e)} onDelete={() => removeEntry(index)}/>
        </div>
      ))}
      <Button
            variant="ghost"
            size="icon"
            className=""
            onClick={addNewEntry}
        >
            <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>
    </div>
  )
}
