"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Simple in-memory cache for remote avatar bytes during a plugin run
const REMOTE_CACHE = {};
// Populate Lineup — Built-in data only (no Figma Variables)
// - Supports locale: English (en), Swedish (sv), Swiss (ch)
// - Supports boys / girls
// - Supports shuffle + start shirt number
// - Finds text layers named: "player-name" and "shirt-number"
function postToUI(type, payload) {
    try {
        figma.ui.postMessage({ type, payload });
    }
    catch (_a) { }
}
function findFirstTextByName(root, target) {
    if ("findAll" in root) {
        const arr = root.findAll((n) => n.type === "TEXT" && n.name === target);
        return arr && arr.length > 0 ? arr[0] : null;
    }
    return null;
}
function ensureEditable(node) {
    return __awaiter(this, void 0, void 0, function* () {
        if (node.fontName === figma.mixed) {
            try {
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                node.fontName = { family: "Inter", style: "Regular" };
            }
            catch (_a) {
                yield figma.loadFontAsync({ family: "Roboto", style: "Regular" });
                node.fontName = { family: "Roboto", style: "Regular" };
            }
        }
        else {
            yield figma.loadFontAsync(node.fontName);
        }
    });
}
function normalizeLocale(lc) {
    const v = (lc || "en").toLowerCase();
    if (v === "sv" || v === "se")
        return "sv";
    if (v === "ch" || v === "de")
        return "ch";
    return "en";
}
const PALETTES_INLINE = {
    en: {
        boys: [
            { bg: "#2E7D32", fg: "#FFFFFF" },
            { bg: "#1565C0", fg: "#FFFFFF" },
            { bg: "#6A1B9A", fg: "#FFFFFF" },
            { bg: "#EF6C00", fg: "#FFFFFF" },
            { bg: "#00897B", fg: "#FFFFFF" },
            { bg: "#37474F", fg: "#FFFFFF" },
            { bg: "#7B1FA2", fg: "#FFFFFF" },
            { bg: "#1B5E20", fg: "#FFFFFF" },
            { bg: "#512DA8", fg: "#FFFFFF" },
            { bg: "#455A64", fg: "#FFFFFF" },
            { bg: "#0277BD", fg: "#FFFFFF" },
            { bg: "#C62828", fg: "#FFFFFF" },
        ],
        girls: [
            { bg: "#AD1457", fg: "#FFFFFF" },
            { bg: "#5E35B1", fg: "#FFFFFF" },
            { bg: "#00838F", fg: "#FFFFFF" },
            { bg: "#F4511E", fg: "#FFFFFF" },
            { bg: "#6D4C41", fg: "#FFFFFF" },
            { bg: "#9C27B0", fg: "#FFFFFF" },
            { bg: "#7CB342", fg: "#FFFFFF" },
            { bg: "#039BE5", fg: "#FFFFFF" },
            { bg: "#8E24AA", fg: "#FFFFFF" },
            { bg: "#D81B60", fg: "#FFFFFF" },
            { bg: "#EC407A", fg: "#FFFFFF" },
            { bg: "#00897B", fg: "#FFFFFF" },
        ],
    },
    sv: {
        boys: [
            { bg: "#1B5E20", fg: "#FFFFFF" },
            { bg: "#0D47A1", fg: "#FFFFFF" },
            { bg: "#4A148C", fg: "#FFFFFF" },
            { bg: "#EF6C00", fg: "#FFFFFF" },
            { bg: "#2E7D32", fg: "#FFFFFF" },
            { bg: "#455A64", fg: "#FFFFFF" },
            { bg: "#6A1B9A", fg: "#FFFFFF" },
            { bg: "#1565C0", fg: "#FFFFFF" },
            { bg: "#7B1FA2", fg: "#FFFFFF" },
            { bg: "#37474F", fg: "#FFFFFF" },
            { bg: "#00897B", fg: "#FFFFFF" },
            { bg: "#C62828", fg: "#FFFFFF" },
        ],
        girls: [
            { bg: "#D81B60", fg: "#FFFFFF" },
            { bg: "#8E24AA", fg: "#FFFFFF" },
            { bg: "#039BE5", fg: "#FFFFFF" },
            { bg: "#7CB342", fg: "#FFFFFF" },
            { bg: "#9C27B0", fg: "#FFFFFF" },
            { bg: "#6D4C41", fg: "#FFFFFF" },
            { bg: "#F4511E", fg: "#FFFFFF" },
            { bg: "#00838F", fg: "#FFFFFF" },
            { bg: "#5E35B1", fg: "#FFFFFF" },
            { bg: "#AD1457", fg: "#FFFFFF" },
            { bg: "#EC407A", fg: "#FFFFFF" },
            { bg: "#00897B", fg: "#FFFFFF" },
        ],
    },
    ch: {
        boys: [
            { bg: "#2E7D32", fg: "#FFFFFF" },
            { bg: "#1565C0", fg: "#FFFFFF" },
            { bg: "#6A1B9A", fg: "#FFFFFF" },
            { bg: "#EF6C00", fg: "#FFFFFF" },
            { bg: "#00897B", fg: "#FFFFFF" },
            { bg: "#37474F", fg: "#FFFFFF" },
            { bg: "#7B1FA2", fg: "#FFFFFF" },
            { bg: "#1B5E20", fg: "#FFFFFF" },
            { bg: "#512DA8", fg: "#FFFFFF" },
            { bg: "#455A64", fg: "#FFFFFF" },
            { bg: "#0277BD", fg: "#FFFFFF" },
            { bg: "#C62828", fg: "#FFFFFF" },
        ],
        girls: [
            { bg: "#D81B60", fg: "#FFFFFF" },
            { bg: "#8E24AA", fg: "#FFFFFF" },
            { bg: "#039BE5", fg: "#FFFFFF" },
            { bg: "#7CB342", fg: "#FFFFFF" },
            { bg: "#9C27B0", fg: "#FFFFFF" },
            { bg: "#6D4C41", fg: "#FFFFFF" },
            { bg: "#F4511E", fg: "#FFFFFF" },
            { bg: "#00838F", fg: "#FFFFFF" },
            { bg: "#5E35B1", fg: "#FFFFFF" },
            { bg: "#AD1457", fg: "#FFFFFF" },
            { bg: "#EC407A", fg: "#FFFFFF" },
            { bg: "#00897B", fg: "#FFFFFF" },
        ],
    },
};
function pickStyle(index, locale, gender) {
    const list = PALETTES_INLINE[locale][gender];
    return list[index % list.length];
}
function initialsFromName(fullName) {
    const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0)
        return "?";
    const first = parts[0].charAt(0) || "";
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
}
// Instance-safe version: update existing avatar node inside instances, only create new if editable
function applyVectorAvatarToNode(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { host, name, style } = opts;
        const D = Math.max(16, (_a = opts.diameter) !== null && _a !== void 0 ? _a : 96);
        const initials = initialsFromName(name);
        // Helper: find an existing avatar target node (ellipse/rect/frame with fills)
        function findAvatarTarget(root) {
            if ("findOne" in root) {
                const target = root.findOne((n) => {
                    const isCandidateName = n.name === "player-avatar" ||
                        n.name === "avatar" ||
                        n.name === "photo";
                    const hasFills = "fills" in n;
                    return isCandidateName && hasFills;
                });
                return target || null;
            }
            return null;
        }
        // Helper: find optional text for initials
        function findAvatarInitials(root) {
            if ("findOne" in root) {
                return root.findOne((n) => n.name === "player-avatar-initials" && n.type === "TEXT");
            }
            return null;
        }
        // If host is an instance, we cannot append children. Try to update existing nodes.
        const isInstance = host.type === "INSTANCE";
        const existingTarget = findAvatarTarget(host);
        const existingInitials = findAvatarInitials(host);
        if (existingTarget) {
            // Update fill color on the existing shape/frame
            const fills = Array.isArray(existingTarget.fills)
                ? existingTarget.fills.slice()
                : [];
            const paint = { type: "SOLID", color: hexToRgb(style.bg) };
            if (fills.length > 0)
                fills[0] = paint;
            else
                fills.push(paint);
            existingTarget.fills = fills;
            // Update initials text if present
            if (existingInitials) {
                yield safeLoadFontForAvatar(existingInitials);
                existingInitials.characters = initials;
                existingInitials.fills = [{ type: "SOLID", color: hexToRgb(style.fg) }];
            }
            return;
        }
        if (isInstance) {
            // Can't create new nodes inside an instance. Silently skip creating,
            // but this still counts as a successful populate for name/number.
            return;
        }
        // Host is editable (frame/group/component). Create the avatar circle + initials.
        let circle = null;
        let text = null;
        circle = figma.createEllipse();
        circle.name = "player-avatar";
        circle.resize(D, D);
        circle.x = 0;
        circle.y = 0;
        if ("appendChild" in host)
            host.appendChild(circle);
        circle.fills = [{ type: "SOLID", color: hexToRgb(style.bg) }];
        circle.strokes = [];
        text = figma.createText();
        text.name = "player-avatar-initials";
        if ("appendChild" in host)
            host.appendChild(text);
        yield safeLoadFontForAvatar(text);
        text.characters = initials;
        text.fontSize = Math.round(D * 0.42);
        text.fills = [{ type: "SOLID", color: hexToRgb(style.fg) }];
        // center text over circle
        const textW = text.width, textH = text.height;
        text.x = circle.x + (D - textW) / 2;
        text.y = circle.y + (D - textH) / 2;
    });
}
function safeLoadFontForAvatar(node) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (node.fontName === figma.mixed) {
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                node.fontName = { family: "Inter", style: "Regular" };
            }
            else {
                yield figma.loadFontAsync(node.fontName);
            }
        }
        catch (_a) {
            yield figma.loadFontAsync({ family: "Roboto", style: "Regular" });
            node.fontName = { family: "Roboto", style: "Regular" };
        }
    });
}
function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return { r, g, b };
}
function loadRemoteAvatarBytes(base_1, folder_1) {
    return __awaiter(this, arguments, void 0, function* (base, folder, maxCount = 60) {
        const out = [];
        const clean = (base || "").replace(/\/$/, "");
        const dir = (folder || "").replace(/^\/+|\/+$/g, "");
        if (!clean || !dir)
            return out;
        let consecutiveMisses = 0;
        const MISS_LIMIT = 8;
        for (let i = 1; i <= maxCount; i++) {
            const n = String(i).padStart(2, "0");
            const url = `${clean}/${dir}/${n}.png`;
            try {
                const res = yield fetch(url);
                if (!res.ok) {
                    consecutiveMisses++;
                    if (consecutiveMisses >= MISS_LIMIT && out.length > 0)
                        break;
                    continue;
                }
                const buf = yield res.arrayBuffer();
                out.push(new Uint8Array(buf));
                consecutiveMisses = 0;
            }
            catch (_a) {
                consecutiveMisses++;
                if (consecutiveMisses >= MISS_LIMIT && out.length > 0)
                    break;
            }
        }
        return out;
    });
}
// --- Image avatar helpers ---
function findAvatarTargetGeneric(root) {
    if ("findOne" in root) {
        const target = root.findOne((n) => {
            const isCandidateName = n.name === "player-avatar" || n.name === "avatar" || n.name === "photo";
            const hasFills = "fills" in n;
            return isCandidateName && hasFills;
        });
        return target || null;
    }
    return null;
}
function setImageFillOnTarget(target, image) {
    const paints = Array.isArray(target.fills) ? target.fills.slice() : [];
    const paint = {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: "FILL",
    };
    if (paints.length > 0)
        paints[0] = paint;
    else
        paints.push(paint);
    target.fills = paints;
}
// ---- Built-in data (so plugin is shareable without any setup) ----
function builtInNames(locale, useGirls) {
    const lc = normalizeLocale(locale);
    const data = {
        en: {
            boys: [
                "Liam Carter",
                "Noah Bennett",
                "Oliver Hayes",
                "Elijah Brooks",
                "James Porter",
                "William Reed",
                "Henry Collins",
                "Lucas Turner",
                "Benjamin Gray",
                "Alexander Miles",
                "Ethan Parker",
                "Mason Quinn",
                "Logan Davis",
                "Owen Mitchell",
                "Jack Foster",
            ],
            girls: [
                "Emma Grace",
                "Olivia Rose",
                "Ava Brooks",
                "Sophia Lane",
                "Isabella Reed",
                "Mia Collins",
                "Charlotte Hayes",
                "Amelia Quinn",
                "Harper Miles",
                "Ella Parker",
                "Evelyn Carter",
                "Abigail Moore",
                "Scarlett Davis",
                "Grace Mitchell",
                "Luna Foster",
            ],
        },
        sv: {
            // Swedish
            boys: [
                "Liam Andersson",
                "Noah Johansson",
                "Oliver Karlsson",
                "Elias Svensson",
                "Leo Nilsson",
                "William Eriksson",
                "Oscar Larsson",
                "Hugo Olsson",
                "Axel Persson",
                "Theo Gustafsson",
                "Viktor Lindberg",
                "Albin Berg",
                "Nils Holm",
                "Filip Sandberg",
                "Arvid Lund",
            ],
            girls: [
                "Emma Andersson",
                "Olivia Johansson",
                "Alice Karlsson",
                "Elsa Svensson",
                "Maja Nilsson",
                "Wilma Eriksson",
                "Agnes Larsson",
                "Alva Olsson",
                "Ebba Persson",
                "Freja Gustafsson",
                "Stella Lindberg",
                "Ida Berg",
                "Saga Holm",
                "Tilda Sandberg",
                "Ines Lund",
            ],
        },
        ch: {
            // Swiss (mix of common Swiss/German/French names)
            boys: [
                "Luca Müller",
                "Noah Meier",
                "Liam Schneider",
                "Leon Weber",
                "Elias Frei",
                "Finn Zimmermann",
                "Julian Keller",
                "Nico Fischer",
                "Levin Baumann",
                "Jonas Huber",
                "Matteo Wagner",
                "Moritz Graf",
                "Noel Schmid",
                "Samuel Brunner",
                "Tim Roth",
            ],
            girls: [
                "Mia Müller",
                "Emma Meier",
                "Lina Schneider",
                "Lea Weber",
                "Sofia Frei",
                "Léa Zimmermann",
                "Lina Keller",
                "Nora Fischer",
                "Alina Baumann",
                "Lena Huber",
                "Giulia Wagner",
                "Anna Graf",
                "Mila Schmid",
                "Nina Brunner",
                "Sara Roth",
            ],
        },
    };
    const bucket = data[lc] || data.en;
    return useGirls ? bucket.girls.slice() : bucket.boys.slice();
}
function builtInShirtNumbers(count = 25) {
    const out = [];
    for (let i = 1; i <= count; i++)
        out.push(String(i));
    return out;
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
    return a;
}
figma.showUI(__html__, { width: 380, height: 340 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (!msg)
        return;
    if (msg.type === "scan") {
        try {
            const useGirls = msg.nameSet === "girls";
            const locale = normalizeLocale(msg.locale || "en");
            // Preview from built-ins
            const namePreview = builtInNames(locale, useGirls).slice(0, 5);
            const numberPreview = builtInShirtNumbers(10);
            const sel = figma.currentPage.selection || [];
            const selection = sel.map((n) => ({
                node: n.name,
                hasPlayerName: !!findFirstTextByName(n, "player-name"),
                hasShirtNumber: !!findFirstTextByName(n, "shirt-number"),
            }));
            postToUI("scan-result", {
                names: {
                    source: "built-in",
                    locale,
                    gender: useGirls ? "girls" : "boys",
                    preview: namePreview,
                },
                numbers: { source: "built-in", preview: numberPreview },
                avatar: { requested: !!msg.useAvatar },
                selection,
            });
        }
        catch (e) {
            postToUI("error", "Scan failed: " + ((e === null || e === void 0 ? void 0 : e.message) || e));
        }
        return;
    }
    if (msg.type === "populate") {
        try {
            const useGirls = msg.nameSet === "girls";
            const startNum = typeof msg.startNumber === "number" && msg.startNumber > 0
                ? msg.startNumber | 0
                : 1;
            const shuffleNames = !!msg.shuffle;
            const locale = normalizeLocale(msg.locale || "en");
            const useAvatar = !!msg.useAvatar;
            // Avatar options
            const avatarMode = msg.avatarMode || "vector"; // "vector" | "image"
            const imgBase = typeof msg.imgBase === "string" ? msg.imgBase : "";
            const teamFolder = typeof msg.teamFolder === "string" ? msg.teamFolder : "";
            // Built-in only data
            let names = builtInNames(locale, useGirls);
            let numbers = builtInShirtNumbers(25);
            if (!names.length) {
                figma.notify("No built-in names available");
                return;
            }
            if (!numbers.length) {
                figma.notify("No built-in numbers available");
                return;
            }
            const namesOrdered = names.slice();
            if (shuffleNames)
                shuffle(namesOrdered);
            const startIdx = Math.max(0, startNum - 1);
            const numbersOrdered = numbers
                .slice(startIdx)
                .concat(numbers.slice(0, startIdx));
            const sel = figma.currentPage.selection || [];
            if (!sel.length) {
                figma.notify("Select frames/instances to populate");
                return;
            }
            let remoteAvatars = [];
            if (useAvatar && avatarMode === "image" && imgBase && teamFolder) {
                const cacheKey = `${imgBase}|${teamFolder}`;
                remoteAvatars = REMOTE_CACHE[cacheKey];
                if (!remoteAvatars) {
                    remoteAvatars = yield loadRemoteAvatarBytes(imgBase, teamFolder, 60);
                    REMOTE_CACHE[cacheKey] = remoteAvatars;
                    if (!remoteAvatars || remoteAvatars.length === 0) {
                        figma.notify("No remote PNGs found — using vector avatars.");
                    }
                }
            }
            let count = 0;
            for (let i = 0; i < sel.length; i++) {
                const node = sel[i];
                const tName = findFirstTextByName(node, "player-name");
                const tNum = findFirstTextByName(node, "shirt-number");
                if (!tName && !tNum)
                    continue;
                const nameVal = namesOrdered[i % namesOrdered.length];
                const numVal = numbersOrdered[i % numbersOrdered.length];
                if (tName) {
                    yield ensureEditable(tName);
                    tName.characters = String(nameVal);
                }
                if (tNum) {
                    yield ensureEditable(tNum);
                    tNum.characters = String(numVal);
                }
                // Optionally add/update an avatar (image or vector) if requested
                if (useAvatar) {
                    const gender = useGirls ? "girls" : "boys";
                    const target = findAvatarTargetGeneric(node);
                    if (avatarMode === "image" &&
                        target &&
                        remoteAvatars &&
                        remoteAvatars.length > 0) {
                        const b = remoteAvatars[i % remoteAvatars.length];
                        try {
                            const img = figma.createImage(b);
                            setImageFillOnTarget(target, img);
                        }
                        catch (e) {
                            // fallback to vector if image fails
                            const style = pickStyle(i, locale, gender);
                            yield applyVectorAvatarToNode({
                                host: node,
                                name: String(nameVal),
                                style,
                            });
                        }
                    }
                    else {
                        const style = pickStyle(i, locale, gender);
                        yield applyVectorAvatarToNode({
                            host: node,
                            name: String(nameVal),
                            style,
                        });
                    }
                }
                count++;
            }
            figma.notify("Populated " + count + " item(s).");
        }
        catch (e) {
            postToUI("error", "Populate failed: " + ((e === null || e === void 0 ? void 0 : e.message) || e));
            figma.notify("Populate failed — see UI log.");
        }
    }
});
