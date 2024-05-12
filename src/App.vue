<script setup lang="ts">
import { reactive, toRefs, onBeforeMount, onBeforeUnmount, onUnmounted, } from "vue";

interface File {
    fileName: string;
    path: string;
}

interface Project {
    name: string;
    files: File[];
}

const state = reactive({
    fileGroupList: [] as Project[],
    activeTarget: "",
    openNav: localStorage.isShowNav,
});
const { fileGroupList, activeTarget, openNav } = toRefs(state);

function getSamplesFile() {
    const modules = import.meta.glob([
        "./samples/**/*.*s",
        "!./samples/**/_*.*s",
    ]);

    // create tree
    const disList: Project[] = [];
    for (const path in modules) {
        const arr = path.split("/");
        // const _folder = arr[2].slice(0, 1).toUpperCase() + arr[2].slice(1).toLowerCase();
        const _folder = arr[2].slice(0, 1).toUpperCase() + arr[2].slice(1);
        const _demo = arr[3].replace(/Sample_|\.ts|\.js/g, "");

        if (disList.some((t) => t.name === _folder)) {
            const idx = disList.map((t) => t.name).indexOf(_folder);
            disList[idx].files.push({ fileName: _demo, path: path.slice(1) });
        } else {
            disList.push({
                name: _folder,
                files: [{ fileName: _demo, path: path.slice(1) }],
            });
        }
        Object.assign(state.fileGroupList, disList);
    }
    // console.log(state.fileGroupList);
}

let manifestFile: any

async function loadManifest() {
    try {
        const response = await fetch('manifest.json');
        if (!response.ok) {
            throw new Error('Failed to load manifest');
        }
        return response.json();
    } catch (error) {
        console.error('Error loading manifest:', error);
        throw error;
    }
}

function resolveAssetPath(path: string) {

    let fillpath = `src${path}`
    if (import.meta.env.PROD) {
        return `${__APP_NAME__}/${manifestFile[fillpath].file}` // 通过获取包含源文件路径到构建文件路径的映射的 manifest 文件来动态载入脚本。
    }

    return fillpath
}

function addIframe() {

    const iframe = document.createElement("iframe") as HTMLIFrameElement;
    let path: string = state.activeTarget = localStorage.target || state.fileGroupList[0].files[0].path;

    path = resolveAssetPath(path)

    console.log(path);

    const Native_WebGPU_Script = path.includes("WebGPU") ? `
		let canvas = document.createElement('canvas');
		canvas.style.display = 'block';
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		let html = document.querySelector('html');
		html?.appendChild(canvas);
    ` : '';

    iframe.srcdoc = `
		<style>html,body{margin:0;padding:0;overflow:hidden;height: 100%;width: 100%;}canvas{touch-action:none}.dg{z-index:1 !important;}</style>
		<script>
			import('/${path}');
			${Native_WebGPU_Script}
		</script` + ">";
    document.querySelector("#app")?.appendChild(iframe);
}

function changeMenu(name: string) {
    console.log(name);
}

function changeExample(path: string) {
    if (localStorage.target === path) return;
    localStorage.setItem("target", path);
    removeIframe();
    addIframe();
}

function switchNav() {
    state.openNav = !state.openNav;
    localStorage.setItem("isShowNav", state.openNav ? "noShow" : "");
}

onBeforeMount(async () => {
    getSamplesFile();
    manifestFile = import.meta.env.PROD && await loadManifest();
    addIframe();
});

onBeforeUnmount(() => {
    let iframe = document.querySelector('iframe') as HTMLIFrameElement
    iframe.style.opacity = '0'
})
onUnmounted(() => {
    removeIframe();
});

function removeIframe() {
    document.querySelector("#app iframe")?.remove();
}
</script>

<template>
    <div class="icon" @click="switchNav">
        <img src="./assets/icons/open.svg" class="open" />
    </div>
    <div class="nav" :class="{ openNav }">
        <p class="close">
            <a href="https://github.com/ID-Emmett/offroad3d" target="_blank" title="go to github">DEMO</a>
            <img @click="switchNav" src="./assets/icons/close.svg" />
        </p>
        <div v-for="folder in fileGroupList" :key="folder.name" class="nav-list">
            <span @click="changeMenu(folder.name)">🎬 #{{ folder.name }}</span>
            <a v-for="t in folder.files" :key="t.fileName" @click="changeExample(t.path)"
                :class="{ active: t.path === activeTarget }">🧊 {{ t.fileName }}</a>
        </div>
    </div>
    <!-- <div>🤖👾🦿📸📹🎥🎬🧊👁️‍🗨️👣</div> -->
</template>
