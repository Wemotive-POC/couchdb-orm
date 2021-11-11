import nano from "nano";

function Connection(url) {
    return nano(url);
}

export default Connection;
