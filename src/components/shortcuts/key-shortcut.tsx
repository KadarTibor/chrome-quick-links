export const Shortcut = ({ keys }: { keys: string[] }) => {
    
    function isMac(): boolean {
        return navigator.userAgent.includes("Macintosh");
    }

    function getShortcutLabel(keys: string[]): string[] {
        const mac = isMac();
        return keys.map((key) => {
            if (key.toLowerCase() === "ctrl") {
            return mac ? "cmd ⌘" : "ctrl";
            }
            return key.toLowerCase();
        });
    }

    const displayKeys = getShortcutLabel(keys)

    return (
    <span className="flex gap-1">
        {displayKeys.map((key, index) => {
            return <div className="flex gap-1 items-center">
                <kbd
                    key={index}
                    className="px-2 py-1 text-xs bg-muted border rounded"
                >
                    {key}
                </kbd>
                {index < keys.length - 1 ? <span className="mx-1">+</span> : null}
            </div>
        })}
    </span>
    )
};
