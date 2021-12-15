export const getShortFileName:
  (
    path: string | undefined,
    ellipsis?: number | boolean
  ) => string | undefined = (path, ellipsis = 15) => {
    let fname: string | undefined = path?.split('/').pop();
    // convert boolean(true) to number(default = 15)
    if (typeof ellipsis === 'boolean' && ellipsis) {
      // eslint-disable-next-line no-param-reassign
      ellipsis = 15;
    }
    if (fname && ellipsis) {
      if (fname.length > ellipsis) {
        fname = `${fname.substring(0, ellipsis - 4)}...`;
      }
    }
    return fname;
  };
