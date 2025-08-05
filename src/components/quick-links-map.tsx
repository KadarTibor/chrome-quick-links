import { useEffect, useRef, useState } from "react"
import { KeyValueInput } from "./keyword-entry"
import { Button } from "./ui/button"
import { Download, Plus, Upload } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip"

interface Entry {
  key: string
  value: string
}

export function KeywordMapEditor() {
  const [entries, setEntries] = useState<Entry[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Load from chrome.storage.local
  useEffect(() => {
    loadMapFromStorage();
  }, []);

  function loadMapFromStorage() {
    chrome.storage.sync.get("keywordMap", (result) => {
      const map = result.keywordMap as Record<string, string> || {}
      const initialEntries = Object.entries(map).map(([key, value]) => ({
        key,
        value,
      }))
      setEntries(initialEntries)
    })
  }

  // Save updated map to storage
  const saveToStorage = (updated: Entry[]) => {
    const mapped = Object.fromEntries(updated.map(({ key, value }) => [key, value]))
    chrome.storage.sync.set({ keywordMap: mapped }, () => {
      console.log("Keyword map saved", mapped)
    });
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
    entries.splice(index, 1)
    const updated = [...entries];
    setEntries(updated)
    saveToStorage([...entries])
  }

  const exportJson = () => {
    chrome.storage.sync.get("keywordMap", (result) => {
      const map = result.keywordMap as Record<string, string> || {}
      downloadJson("url-mappings.json", map);
    });
  };

  const downloadJson = (filename: string, jsonData: object) => {
    const jsonStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as Record<string, string>;

        console.log(parsed);

        const loadedEntries = Object.entries(parsed).map(([key, value]) => ({
          key,
          value,
        }));
        saveToStorage([...loadedEntries]);
        setEntries([...loadedEntries])

      } catch (err) {
        console.error("Invalid JSON file", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <h2 className="text-lg font-semibold">⚡️ Links</h2>
      {entries.map((entry, index) => (
        <div key={index}>
          <KeyValueInput keyValue={entry} onChange={(e) => handleChange(index, e)} onDelete={() => removeEntry(index)} />
        </div>
      ))}
      <div className="flex flex-row gap-4">
        <Button
          variant="ghost"
          size="icon"
          className=""
          onClick={addNewEntry}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className=""
          onClick={exportJson}
        >
          <Download className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className=""
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </div>
    </div>
  )
}
