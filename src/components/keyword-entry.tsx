import { Check, MoveRight, Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import clsx from "clsx";

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
        <div className={cn("flex flex-row gap-4 items center rounded-[10px] shadow-custom-dark dark:bg-[#333333] p-4", className)}>
            <div className="flex flex-row gap-1 items-center">
                <Input
                    id="key"
                    className={clsx(
                        "border rounded-md px-3 py-2",
                        !editMode && "bg-gray-100 text-gray-500 cursor-default"
                    )}
                    placeholder="keyword"
                    readOnly={!editMode}
                    value={keyValue.key}
                    onDoubleClick={() => setEditMode(true)}
                    onChange={(e) => onChange({ ...keyValue, key: e.target.value })}
                />
            </div>
            <MoveRight className="h-8 w-8 text-muted-foreground" />
            <div className="flex flex-row gap-2 items-center">
                <Input
                    id="value"
                    className={clsx(
                        "border rounded-md px-3 py-2",
                        !editMode && "bg-gray-100 text-gray-500 cursor-default"
                    )}
                    placeholder="Url"
                    readOnly={!editMode}
                    value={keyValue.value}
                    onDoubleClick={() => setEditMode(true)}
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
