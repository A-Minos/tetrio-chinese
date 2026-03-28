export const processPlacement = async (input: unknown, extraArgs: unknown[] = []) => {
    if (typeof input === "string") {
        return input;
    }

    if (typeof input === "function") {
        return await input(...extraArgs);
    }

    return null;
};