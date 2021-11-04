import { notification } from "antd";

export const url = (segment: string): string => REMOTE + segment;

/**
 * Packaged fetch method for http requests
 * @param methodUrl "GET /xxx" like pattern
 */
// TODO: fingure out a way to gracefully notate Promise type
export const request = (methodUrl: string): Promise<any> => {
  const seg = methodUrl.split(" ");

  return new Promise((resolve, reject) => {
    fetch(url(seg[1]), {
      method: seg[0]
    })
      .then(res => res.json())
      .then(json => {
        if (json.code === 200) {
          resolve(json)
        } else if (json.code === 401) {
          notification.warn({
            message: 'Login has expired',
            description: 'Now redirecting you to the login page.'
          })
          reject();
        } else {
          notification.error({
            message: `${json.code} ${json.message}`
          });
          reject();
        }
      })
      .catch(err => {
        notification.error({
          message: 'Error in http request',
          description: err
        });
        reject();
      });
  })
}
