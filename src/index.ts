import { join } from 'path';
import HttpClient from './http-client';
import { getRestApiArr } from './read-raml';
import { loadConfig } from './util';
import { loadApi as loadRamlApi } from 'raml-1-parser';
import { Api } from 'raml-1-parser/dist/parser/artifacts/raml10parserapi';

let webApiArr;

export const initProject = async () => {
  const env = process.env.NODE_ENV;
  const config = await loadConfig();
  let host = `http://localhost:${config.port}`;
  if (config.runner && env) {
    host = config.runner[env];
  }
  if (!host) {
    throw Error(`Can't find host in .raml-config.json when env is "${env}"`);
  }
  HttpClient.setHost(host);

  const apiJSON = await loadRamlApi(join(config.raml, config.main)) as Api;
  webApiArr = getRestApiArr(apiJSON);
};

export const loadApi = (description) => {
  if (!description) { throw Error('Please set API description!'); }
  if (!webApiArr) { throw Error('Can\'t find API'); }
  const api = webApiArr
    .filter((webApi) => webApi.description === description)
    .pop();
  if (!api) { throw Error(`Can't find API by '${description}'!`); }
  return async (uriParameters, queryParameter, body) => {
    try {
      return await HttpClient.send(api, uriParameters, queryParameter, body);
    } catch (error) {
      throw new Error(`description: '${description}' ${error.message}`);
    }
  };
};
