import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import debounce from "lodash.debounce"
import { KeyValueInput } from "./keyword-entry"
import { Button } from "./ui/button"
import { Download, Plus, Upload } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip"
import { Shortcut } from "./shortcuts/key-shortcut"
import { Label } from "./ui/label"

interface Entry {
  key: string
  value: string
}

// chrome.storage.sync allows 120 writes/minute and 1800/hour, and rejects the
// ones over the line. Typing used to write once per keystroke, which is well
// past that for a single URL, so edits have to settle before they're persisted.
const SAVE_DEBOUNCE_MS = 400

// A half-typed keyword must never reach storage: the map is keyed by keyword,
// so an entry that transiently collides with a saved one would overwrite it.
// Blank keys are skipped and the first occurrence of a duplicate wins.
function buildMap(entries: Entry[]) {
  const map: Record<string, string> = {}
  const duplicates: string[] = []

  for (const { key, value } of entries) {
    const keyword = key.trim()
    if (!keyword) continue
    if (keyword in map) {
      if (!duplicates.includes(keyword)) duplicates.push(keyword)
      continue
    }
    map[keyword] = value.trim()
  }

  return { map, duplicates }
}

export function KeywordMapEditor() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
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
  const writeToStorage = useCallback((updated: Entry[]) => {
    const { map } = buildMap(updated)
    // The background listens on chrome.storage.onChanged, so writing is enough.
    chrome.storage.sync.set({ keywordMap: map }, () => {
      // Over quota the write is dropped and only lastError says so — without
      // this the UI keeps showing text that was never saved.
      const error = chrome.runtime.lastError
      if (error) {
        console.error("Keyword map NOT saved", error.message)
        setSaveError(error.message ?? "Unknown storage error")
        return
      }
      setSaveError(null)
    });
  }, [])

  const scheduleSave = useMemo(
    () => debounce(writeToStorage, SAVE_DEBOUNCE_MS),
    [writeToStorage]
  )

  // Discrete actions (delete, import) are one write each, so they skip the
  // debounce — but they still have to drop a keystroke write queued behind
  // stale entries.
  const saveNow = useCallback((updated: Entry[]) => {
    scheduleSave.cancel()
    writeToStorage(updated)
  }, [scheduleSave, writeToStorage])

  // The popup can be dismissed mid-keystroke. pagehide is the last moment the
  // pending write can still be handed to the browser process.
  useEffect(() => {
    const flush = () => { scheduleSave.flush() }
    window.addEventListener("pagehide", flush)
    return () => {
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [scheduleSave])

  const handleChange = (index: number, updatedEntry: Entry) => {
    const updated = [...entries]
    updated[index] = updatedEntry
    setEntries(updated)
    scheduleSave(updated)
  }

  // Nothing to persist until the row has a keyword, so this doesn't write.
  const addNewEntry = () => {
    setEntries([...entries, { key: "", value: "" }])
  }

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index)
    setEntries(updated)
    saveNow(updated)
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

        const loadedEntries = Object.entries(parsed).map(([key, value]) => ({
          key,
          value,
        }));
        saveNow(loadedEntries);
        setEntries(loadedEntries)

      } catch (err) {
        console.error("Invalid JSON file", err);
        setSaveError("That file isn't valid JSON")
      }
    };
    reader.readAsText(file);
  };

  const { duplicates } = buildMap(entries)

  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <Label className="text-2xl font-semibold">
        Quick 🔗
      </Label>
      {saveError && (
        <Label className="text-sm font-normal text-red-500">
          Not saved — {saveError}
        </Label>
      )}
      {duplicates.length > 0 && (
        <Label className="text-sm font-normal text-red-500">
          Duplicate keyword{duplicates.length > 1 ? "s" : ""} not saved: {duplicates.join(", ")}
        </Label>
      )}
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

      <Label className="text-2xl font-semibold">
          Keyboard Shortcuts
      </Label>
      <div className="flex flex-row justify-between w-full">
        <Label>Duplicate current tab</Label>
        <Shortcut keys={['Ctrl', 'Shift', 'U']} />
      </div>
      <div className="flex flex-row justify-between w-full">
        <Label>Move current tab to new window</Label>
        <Shortcut keys={['Ctrl', 'Shift', 'Y']} />
      </div>
    </div>
  )
}
