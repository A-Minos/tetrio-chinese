// @ts-nocheck

import {mergeAll} from "remeda";

export default async () => {
    const textMap = mergeAll(
        Object.values(
            import.meta.glob<[]>('@/translates/textMap/*.json', {
                import: 'default',
                eager: true
            })
        )
    )

    const tooltipMap = mergeAll(
        Object.values(
            import.meta.glob<[]>('@/translates/tooltipMap/*.json', {
                import: 'default',
                eager: true
            })
        )
    )

    const specialTextMap = mergeAll(
        Object.values(
            import.meta.glob<[]>('@/translates/specialTextMap/*.json', {
                import: 'default',
                eager: true
            })
        )
    )


    const placeholderMap = mergeAll(
        Object.values(
            import.meta.glob<[]>('@/translates/placeholderMap/*.json', {
                import: 'default',
                eager: true
            })
        )
    )

    const pseudoElementMap = mergeAll(
        Object.values(
            import.meta.glob<[]>('@/translates/pseudoElementMap/*.json', {
                import: 'default',
                eager: true
            })
        )
    )

    const dataIdMap = mergeAll(
        Object.values(
            import.meta.glob<[]>('@/translates/dataIdMap/*.json', {
                import: 'default',
                eager: true
            })
        )
    )

    const toLowerCaseKeys = (obj) => {
        const result = {};
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key.toLowerCase()] = obj[key];
            }
        }
        return result;
    };

    const lowerTextMap = toLowerCaseKeys(textMap);
    const lowerTooltipMap = toLowerCaseKeys(tooltipMap);
    const lowerPlaceholderMap = toLowerCaseKeys(placeholderMap);
    const lowerPseudoElementMap = toLowerCaseKeys(pseudoElementMap);

    function shouldExclude(node) {
        function isExcluded(currentNode) {
            return (
                currentNode.nodeType === Node.ELEMENT_NODE &&
                (currentNode.getAttribute("data-uid") === "5f4ca7f5fdcc602e78a65bba" ||
                    ["breadcrumbs", "dirtyflag_gfx", "dirtyflag_net", "dirtyflag_state", "dirtyflag_client", "dirtyflag_gl"].includes(currentNode.getAttribute("id")) ||
                    ["user", "leagueplayer_name", "primary", "uniflex-item"].some((className) => currentNode.classList.contains(className)) ||
                    currentNode.className === "chat_message ig_chat_message" ||
                    currentNode.className === "chat_message dm_chat_message" ||
                    currentNode.className === "chat_message ig_chat_message roomownerchat" ||
                    ["supporterchat", "supporterchat_t1", "supporterchat_t2", "supporterchat_t3", "supporterchat_t4"].some((className) => currentNode.classList.contains(className)) ||
                    currentNode.classList.contains("user-tooltip") ||
                    currentNode === document.querySelector(".tetra_modal h2") ||
                    currentNode.getAttribute("data-username") ||
                    currentNode.closest('.room_config_item.room_config_spinner.flex-item.ns'))
            );
        }


        let currentNode = node;
        while (currentNode) {
            if (isExcluded(currentNode)) return true;
            currentNode = currentNode.parentNode;
        }
        return false;
    }

// 查找最近的祖先 data-id
    function findNearestDataId(node) {
        let current = node.parentNode;
        while (current && current !== document) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                const did = current.getAttribute("data-id");
                if (did && dataIdMap.hasOwnProperty(did)) return did;
            }
            current = current.parentNode;
        }
        return null;
    }

// 应用 data-id 的部分替换
    function applyDataIdReplaceToText(text, dataId) {
        const rule = dataIdMap[dataId];
        if (!rule) return {text, replaced: false};
        const [pattern, replacement] = rule;
        const newText = text.replace(pattern, replacement);
        return {text: newText, replaced: newText !== text};
    }

// 将特殊正则映射应用到纯文本
    function applySpecialMaps(text) {
        let out = text;
        for (let [key, value] of Object.entries(specialTextMap)) {
            const re = new RegExp(key, "gi");
            const replaced = out.replace(re, value);
            if (replaced !== out) out = replaced;
        }
        return out;
    }

// 替换文本节点内容
    function replaceText(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 占位符替换
            if (node.hasAttribute?.("placeholder")) {
                const ph = node.getAttribute("placeholder");
                if (ph && lowerPlaceholderMap.hasOwnProperty(ph.toLowerCase())) {
                    node.setAttribute("placeholder", lowerPlaceholderMap[ph.toLowerCase()]);
                }
            }

            // 伪元素文本替换
            try {
                let styleSheet = document.styleSheets[0];
                if (!styleSheet) {
                    const styleEl = document.createElement("style");
                    document.head.appendChild(styleEl);
                    styleSheet = styleEl.sheet;
                }
                for (let [key, value] of Object.entries(lowerPseudoElementMap)) {
                    const baseSelector = key.split("::")[0];
                    if (node.matches && node.matches(baseSelector)) {
                        const ruleText = `${key}{content:"${value}";}`;
                        if (styleSheet.insertRule) {
                            styleSheet.insertRule(ruleText, styleSheet.cssRules.length);
                        } else if (styleSheet.addRule) {
                            styleSheet.addRule(key, `content:"${value}";`);
                        }
                    }
                }
            } catch (e) {
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue.trim();
            if (!text) return;

            // data-id 替换（只替换匹配部分）
            const nearestDataId = findNearestDataId(node);
            if (nearestDataId) {
                const {text: newText} = applyDataIdReplaceToText(text, nearestDataId);
                text = newText;
            }

            // 全局整句替换（不覆盖已替换部分 text 中未匹配 data-id 的文本）
            if (lowerTextMap.hasOwnProperty(text.toLowerCase()) && !shouldExclude(node)) {
                text = lowerTextMap[text.toLowerCase()];
            }

            // 特殊正则替换
            text = applySpecialMaps(text);

            node.nodeValue = text;
        }

        // 递归处理子节点
        for (let i of node.childNodes) {
            replaceText(i);
        }
    }

// 替换悬停文本
    function replaceTooltips(event) {
        const tooltip = event.target;
        let title = tooltip.getAttribute("title");
        if (title) {
            if (lowerTooltipMap.hasOwnProperty(title.toLowerCase())) {
                tooltip.setAttribute("title", lowerTooltipMap[title.toLowerCase()]);
                tooltip.removeAttribute("data-original-title");
            } else {
                title = applySpecialMaps(title);
                tooltip.setAttribute("title", title);
            }
        }
    }

// MutationObserver 处理新增节点
    function handleMutation(mutationsList) {
        for (let mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                for (let node of mutation.addedNodes) {
                    replaceText(node);
                }
            }
        }
    }

// 初始文本替换
    replaceText(document.body);

// 悬停文本事件
    document.addEventListener(
        "mouseenter",
        (event) => {
            const target = event.target;
            if (target.hasAttribute?.("title")) {
                replaceTooltips(event);
            }
        },
        true,
    );

// MutationObserver
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, {childList: true, subtree: true});

// ===== 好友列表专用优化 =====
    let tabKeyTimer = null;
    let isObserverActive = true;
    document.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
            clearTimeout(tabKeyTimer);
            if (isObserverActive) {
                observer.disconnect();
                isObserverActive = false;
            }
            tabKeyTimer = setTimeout(() => {
                if (!isObserverActive) {
                    observer.observe(document.body, {childList: true, subtree: true});
                    isObserverActive = true;
                }
            }, 500);
        }
    });
}