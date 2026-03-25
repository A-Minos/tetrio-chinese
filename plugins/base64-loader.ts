import fs from "node:fs";

export default () => {
    return {
        name: "base64-loader",
        transform(_: any, id: string) {
            const [path, query] = id.split("?");
            if (query != "base64") return null;

            const data = fs.readFileSync(path);
            const base64 = data.toString("base64");

            return `export default '${base64}';`;
        },
    }
}