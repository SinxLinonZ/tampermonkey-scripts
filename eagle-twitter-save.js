// ==UserScript==
// @name         Save Twitter Image to Eagle
// @namespace    http://tampermonkey.net/
// @version      2024-08-08
// @description  Save Twitter Image to Eagle
// @author       SinxLinonZ
// @license      MIT License
// @match        https://*.twitter.com/*
// @match        https://*.x.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @resource     Materialize_css https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @run-at       document-end
// ==/UserScript==

GM_addStyle(GM_getResourceText('Materialize_css'));

function getImageInfo(element) {
    const imgElement = element;
    const articleElement = imgElement.closest("article");

    const imgData = {
        src: imgElement.src.replace(/name=(.*)/, "name=orig").replace("format=webp", "format=jpg"),
        tweetLink: imgElement.closest('a').href.replace(/\/photo\/\d+$/, ''),
        tweetUserId: '@' + articleElement.querySelector('a[href^="/"]').href.split('/').pop(),
        tweetText: articleElement.querySelector('div[dir="auto"]')?.textContent || '',
        tweetTime: Math.floor(new Date(articleElement.querySelector('time').dateTime).getTime()),
    }

    console.table(imgData);
    return imgData;
}

function getArticleImages(element) {
    if (element.length == 0) return;

    const imgElement = element[0];
    const articleElement = imgElement.closest("article");

    const imgDataList = [...articleElement.querySelectorAll('a[href*="/photo/"] img')].map(img => {
        return getImageInfo(img);
    });

    return imgDataList;
}

function saveImage(imgData) {
    GM_xmlhttpRequest({
        url: 'http://localhost:41595/api/item/addFromURL',
        method: "POST",
        data: JSON.stringify({
            url: imgData.src,
            name: imgData.tweetUserId + ' ' + imgData.tweetText,
            annotation: imgData.tweetUserId + '\r\n' + imgData.tweetText,
            website: imgData.tweetLink,
            modificationTime: imgData.tweetTime,
        }),
        onload: function (response) {
            if (response.status !== 200) {
                console.error('Eagle Save Error', response);
                M.toast({ html: `<span style="color: red; font-weight: bold;">Eagle Save Error: ${imgData.tweetUserId}</span>` });
                return;
            }
            M.toast({ html: `<span style="color: green; font-weight: bold;">Saved: <span style="color: white">${imgData.tweetUserId}</span></span>` });
        }
    });
}

(function () {
    'use strict';

    console.log('Eagle Twitter Save Start');
    M.AutoInit();

    $('body').on('keydown', function (e) {
        if (!e.shiftKey) {
            return;
        }
        e.preventDefault();

        const imgData = getArticleImages(document.querySelectorAll('a:hover'));
        imgData.forEach(imgData => {
            saveImage(imgData);
        });
    });

    $('body').on('contextmenu', function (e) {
        if (!e.ctrlKey) {
            return;
        }
        e.preventDefault();

        const imgData = getImageInfo(e.target);
        saveImage(imgData);
    });
})();
