import { Check, MoveRight, Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface KeyValueInputProps {
    keyValue: { key: string; value: string }
    onChange: (updated: { key: string; value: string }) => void
    onDelete: () => void
    className?: string
}

export function KeyValueInput({ keyValue, onChange, onDelete, className }: KeyValueInputProps) {

    const [editMode, setEditMode] = useState(false)
    useEffect(() => {
        if (keyValue.key === "" && keyValue.value === "") {
            setEditMode(true)
        }
    }, [keyValue])

    return (
        <div className={cn("flex flex-row gap-4 items center", className)}>
            <div className="flex flex-row gap-1 items-center">
                <Input
                    id="key"
                    placeholder="keyword"
                    disabled={!editMode}
                    value={keyValue.key}
                    onChange={(e) => onChange({ ...keyValue, key: e.target.value })}
                />
            </div>
            <MoveRight className="h-8 w-8 text-muted-foreground" />
            <div className="flex flex-row gap-2 items-center">
                <Input
                    id="value"
                    placeholder="Url"
                    disabled={!editMode}
                    value={keyValue.value}
                    onChange={(e) => onChange({ ...keyValue, value: e.target.value })}
                />
            </div>
            {editMode ?
                <Button
                    variant="ghost"
                    size="icon"
                    className=""
                    onClick={() => setEditMode(false)}
                >
                    <Check className="h-4 w-4 text-muted-foreground" />
                </Button>
                :
                <Button
                    variant="ghost"
                    size="icon"
                    className=""
                    onClick={() => setEditMode(true)}
                >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
            }
            <Button
                variant="ghost"
                size="icon"
                className=""
                onClick={() => onDelete()}
            >
                <Trash className="h-4 w-4 text-muted-foreground" />
            </Button>
        </div>
    )
}
