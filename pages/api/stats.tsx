import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('content-type', 'image/svg+xml');

    const downloads = await getDownloads(req);
    const rounding = req.query.rounding || 3;
    const color = req.query.color || '007ec6';
    res.status(200).send(`
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="20" role="img" aria-label="${downloads}">
            <linearGradient id="s" x2="0" y2="100%">
                <stop offset="0" stop-color="#bbb" stop-opacity=".1" />
                <stop offset="1" stop-opacity=".1" />
            </linearGradient>
            <clipPath id="r">
                <rect width="125" height="20" rx="${rounding}" fill="#fff" />
            </clipPath>
            <g clip-path="url(#r)">
                <rect width="70" height="20" fill="#555" />
                <rect x="70" width="60" height="20" fill="#${color}" />
                <rect width="110" height="20" fill="url(#s)" />
            </g>
            <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
                <text x="350" y="140" transform="scale(.1)" fill="#fff">Downloads</text>
                <text x="960" y="140" transform="scale(.1)" fill="#fff">${downloads}</text>
            </g>
        </svg>
    `);
}

type CacheElement = {
    downloads: string,
    time: number
}

const cache: {[key: string]: CacheElement} = {};

async function getDownloads(req: NextApiRequest) {
    let downloads: any = -1;
    const username = req.query.username;
    if (username && /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username.toString())) {
        const cacheElm = cache[username.toString().toLowerCase()];
        console.log(cacheElm);
        if (cacheElm !== undefined && Date.now() - cacheElm.time < (process.env.CACHE_DURATION || 180000)) {
            return cacheElm.downloads;
        } else {
            const repos = await (await fetch(`https://api.github.com/users/${username}/repos`)).json();
            downloads = 0;
    
            const names: string[] = [];

            for (let i = 0; i < repos.length; i++) {
                const repoName = repos[i].name;
                if (names.includes(repoName)) {
                    continue;
                }
                names.push(repoName);
                const releases = await (await fetch(`https://api.github.com/repos/${username}/${repoName}/releases`)).json();
                for (let l = 0; l < releases.length; l++) {
                    const assets = releases[l].assets;
                    for (let m = 0; m < assets.length; m++) {
                        downloads += assets[m].download_count;
                    }
                }
            }

            if (downloads >= 1000000000) {
                downloads = (downloads / 1000000000).toFixed(2) + "b";
            } else if (downloads >= 1000000) {
                downloads = (downloads / 1000000).toFixed(2) + "m";
            } else if (downloads >= 100000) {
                downloads = Math.round(downloads / 1000) + "k";
            } else if (downloads === -1) {
                downloads = "N/A";
            } else {
                downloads = downloads.toString();
            }

            cache[username.toString().toLowerCase()] = {
                downloads: downloads,
                time: Date.now()
            }
        }
    }

    return downloads;
}