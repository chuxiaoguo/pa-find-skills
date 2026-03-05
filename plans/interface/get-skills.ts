const getSkills = async (id: number) => {
    const url = `https://market.paic.com.cn/resource/download/${id}`;

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': '',
        'Referer': 'https://market.paic.com.cn/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            body: null
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};

export interface File {
    downloadUrl: string;
    appFileName: string;
    md5?: string;
    fileSize?: number;
    fileType?: string;
    uploadTime?: string;
}

export interface Data {
    id: number;
    title?: string;
    description?: string;
    version?: string;
    author?: string;
    categoryId?: number;
    categoryName?: string;
    tags?: string[];
    downloadCount?: number;
    rating?: number;
    ratingCount?: number;
    isPublished?: boolean;
    isRecommended?: boolean;
    isFree?: boolean;
    price?: number;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
}

export interface RootObject {
    code: number;
    message: string;
    data: Data;
    file?: File;
    success: boolean;
    timestamp?: number;
}

export default getSkills;
