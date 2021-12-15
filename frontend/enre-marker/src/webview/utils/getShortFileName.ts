export const getShortFileName:
  (path: string | undefined, elipsis?: number) => string | undefined = (path, elipsis = 15) => {
    let fname: string | undefined = path?.split('/').pop();
    if (fname && elipsis) {
      if (fname.length > elipsis) {
        fname = `${fname.substring(0, elipsis - 4)}...`;
      }
    }
    return fname;
  };
