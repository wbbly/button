export function timerDuration(ms) {
    let hour, minute, seconds;
    seconds = Math.floor(ms / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;

    return `${padTime(hour)}:${padTime(minute)}:${padTime(seconds)}`;
}

function padTime(item){
    if (!item) {
        return '00';
    }

    if ((item + '').length === 1) {
        return '0' + item;
    }

    return item;
}