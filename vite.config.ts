import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

const port = {
	client: 8083,
	server: 8089,
};

function injectDevServerFlag(): Plugin {
	return {
		name: "inject-dev-server-flag",
		transformIndexHtml: {
			order: "pre",
			handler() {
				return [{ tag: "script", children: "window.__nonameDevServer=true;", injectTo: "head-prepend" }];
			},
		},
	};
}

export default defineConfig(({ command }) => ({
	root: ".",
	resolve: {
		alias: {
			"@": "/noname",
			"noname": "/noname.js",
		},
		extensions: [".tsx", ".ts", ".js", ".vue"],
	},
	plugins: [vue(), ...(command === "serve" ? [injectDevServerFlag()] : [])],
	server: {
		open: true,
		host: "127.0.0.1",
		port: port.client,
		proxy: {
			"/checkFile": "http://127.0.0.1:" + port.server,
			"/checkDir": "http://127.0.0.1:" + port.server,
			"/readFile": "http://127.0.0.1:" + port.server,
			"/readFileAsText": "http://127.0.0.1:" + port.server,
			"/writeFile": "http://127.0.0.1:" + port.server,
			"/removeFile": "http://127.0.0.1:" + port.server,
			"/getFileList": "http://127.0.0.1:" + port.server,
			"/createDir": "http://127.0.0.1:" + port.server,
			"/removeDir": "http://127.0.0.1:" + port.server,
		},
	},
}));
