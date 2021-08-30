export const genRandomStr = () => Math.random().toString(32).substring(2);

export const wait = (sec: number) => new Promise((resolve) => setTimeout(resolve, sec));
