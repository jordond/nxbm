import axios, { AxiosPromise, AxiosRequestConfig } from "axios";

import { addQueryParams, QueryParams } from "./util";

interface ApiRequest extends AxiosRequestConfig {
  query?: QueryParams;
}

function get<T>(url: string, options: ApiRequest = {}): AxiosPromise<T> {
  return axios.get(createURL(url), options);
}

function post<T, R>(
  url: string,
  body: T,
  options: ApiRequest = {}
): AxiosPromise<R> {
  return axios.post(createURL(url), body, options);
}

function put<T, R>(
  url: string,
  body: T,
  options: ApiRequest = {}
): AxiosPromise<R> {
  return axios.put(createURL(url), body, options);
}

function doDelete<T>(url: string, options: ApiRequest = {}): AxiosPromise<T> {
  return axios.delete(createURL(url), options);
}

function createURL(url: string, { query }: ApiRequest = {}): string {
  return query ? addQueryParams(url, query) : url;
}

export const client = {
  get: async <T>(url: string, options?: ApiRequest): Promise<T> => {
    return (await get<T>(url, options)).data;
  },
  post: async <T, R>(
    url: string,
    body?: any,
    options?: ApiRequest
  ): Promise<R> => {
    return (await post<T, R>(url, body, options)).data;
  },
  put: async <T, R>(
    url: string,
    body?: any,
    options?: ApiRequest
  ): Promise<R> => {
    return (await put<T, R>(url, body, options)).data;
  },
  delete: async <T>(url: string, options?: ApiRequest): Promise<T> => {
    return (await doDelete<T>(url, options)).data;
  }
};
