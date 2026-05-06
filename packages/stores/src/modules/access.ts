import type { RouteRecordRaw } from 'vue-router';

import type { MenuRecordRaw } from '@vben-core/typings';

import { acceptHMRUpdate, defineStore } from 'pinia';

type AccessToken = null | string;

interface AuthTokenInfo {
  expiresAt?: null | number;
  expiresIn?: null | number;
  scope?: string;
  tenant?: null | string;
  tokenType?: null | string;
  username?: string;
}

interface AccessState {
  /**
   * 权限码
   */
  accessCodes: string[];
  /**
   * 可访问的菜单列表
   */
  accessMenus: MenuRecordRaw[];
  /**
   * 可访问的路由列表
   */
  accessRoutes: RouteRecordRaw[];
  /**
   * 登录 accessToken
   */
  accessToken: AccessToken;
  /**
   * accessToken 过期时间戳
   */
  expiresAt?: null | number;
  /**
   * accessToken 有效秒数
   */
  expiresIn?: null | number;
  /**
   * 是否已经检查过权限
   */
  isAccessChecked: boolean;
  /**
   * 是否锁屏状态
   */
  isLockScreen: boolean;
  /**
   * 锁屏密码
   */
  lockScreenPassword?: string;
  /**
   * 登录是否过期
   */
  loginExpired: boolean;
  /**
   * 登录 refreshToken
   */
  refreshToken: AccessToken;
  /**
   * token scope
   */
  scope?: string;
  /**
   * 登录租户
   */
  tenant?: null | string;
  /**
   * token 类型
   */
  tokenType?: null | string;
  /**
   * 登录用户名
   */
  username?: string;
}

/**
 * @zh_CN 访问权限相关
 */
export const useAccessStore = defineStore('core-access', {
  actions: {
    getMenuByPath(path: string) {
      function findMenu(
        menus: MenuRecordRaw[],
        path: string,
      ): MenuRecordRaw | undefined {
        for (const menu of menus) {
          if (menu.path === path) {
            return menu;
          }
          if (menu.children) {
            const matched = findMenu(menu.children, path);
            if (matched) {
              return matched;
            }
          }
        }
      }
      return findMenu(this.accessMenus, path);
    },
    lockScreen(password: string) {
      this.isLockScreen = true;
      this.lockScreenPassword = password;
    },
    setAccessCodes(codes: string[]) {
      this.accessCodes = codes;
    },
    setAccessMenus(menus: MenuRecordRaw[]) {
      this.accessMenus = menus;
    },
    setAccessRoutes(routes: RouteRecordRaw[]) {
      this.accessRoutes = routes;
    },
    clearAuthTokenInfo() {
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      this.expiresIn = null;
      this.scope = undefined;
      this.tenant = null;
      this.tokenType = null;
      this.username = undefined;
    },
    setAccessToken(token: AccessToken) {
      this.accessToken = token;
    },
    setIsAccessChecked(isAccessChecked: boolean) {
      this.isAccessChecked = isAccessChecked;
    },
    setLoginExpired(loginExpired: boolean) {
      this.loginExpired = loginExpired;
    },
    setRefreshToken(token: AccessToken) {
      this.refreshToken = token;
    },
    setTokenInfo(
      tokenInfo: AuthTokenInfo & {
        accessToken: AccessToken;
        refreshToken?: AccessToken;
      },
    ) {
      this.accessToken = tokenInfo.accessToken;
      this.refreshToken = tokenInfo.refreshToken ?? null;
      this.expiresAt = tokenInfo.expiresAt ?? null;
      this.expiresIn = tokenInfo.expiresIn ?? null;
      this.scope = tokenInfo.scope;
      this.tenant = tokenInfo.tenant ?? null;
      this.tokenType = tokenInfo.tokenType ?? null;
      this.username = tokenInfo.username;
    },
    unlockScreen() {
      this.isLockScreen = false;
      this.lockScreenPassword = undefined;
    },
  },
  persist: {
    // 持久化
    pick: [
      'accessToken',
      'refreshToken',
      'expiresAt',
      'expiresIn',
      'scope',
      'tenant',
      'tokenType',
      'username',
      'accessCodes',
      'isLockScreen',
      'lockScreenPassword',
    ],
  },
  state: (): AccessState => ({
    accessCodes: [],
    accessMenus: [],
    accessRoutes: [],
    accessToken: null,
    expiresAt: null,
    expiresIn: null,
    isAccessChecked: false,
    isLockScreen: false,
    lockScreenPassword: undefined,
    loginExpired: false,
    refreshToken: null,
    scope: undefined,
    tenant: null,
    tokenType: null,
    username: undefined,
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAccessStore, hot));
}
