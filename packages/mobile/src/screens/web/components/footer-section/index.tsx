import React, { FunctionComponent, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useStyle } from '../../../../styles';
import { useWebViewState } from '../context';
import { useSmartNavigation } from '../../../../navigation.provider';
import { useNavigation } from '@react-navigation/core';

import {
  RightArrowIcon,
  HomeIcon,
  ThreeDotsIcon,
  TabIcon,
} from '../../../../components/icon';
import { BrowserSectionModal } from '../section-title';

export const BrowserFooterSection: FunctionComponent<{
  isSwitchTab: boolean;
  setIsSwitchTab: Function;
  onHandleUrl?: Function;
}> = ({ isSwitchTab, setIsSwitchTab, onHandleUrl }) => {
  const style = useStyle();
  const [isOpenSetting, setIsOpenSetting] = useState(false);
  const smartNavigation = useSmartNavigation();
  const webViewState = useWebViewState();

  const onPress = (type: any) => {
    try {
      switch (type) {
        case 'settings':
          return setIsOpenSetting(!isOpenSetting);
        case 'back':
          if (!webViewState.canGoBack) {
            smartNavigation.goBack();
          } else if (webViewState.webView) {
            webViewState.webView.goBack();
          }
          return;
        case 'next':
          if (webViewState.webView) {
            webViewState.webView.goForward();
          } else {
            onHandleUrl();
          }
          return;
        case 'tabs':
          setIsSwitchTab(!isSwitchTab);
          return;
        case 'home':
          if (webViewState.webView === null) {
            return setIsSwitchTab(false);
          }
          return smartNavigation.navigateSmart('Browser', {});
      }
    } catch (error) {
      console.log({ error });
    }
  };

  const arrayIcon = ['back', 'next', 'tabs', 'home', 'settings'];
  const renderIcon = (type, tabNum = 0) => {
    switch (type) {
      case 'back':
        return (
          <TouchableOpacity onPress={() => onPress(type)}>
            <RightArrowIcon type={'left'} color={'white'} height={18} />
          </TouchableOpacity>
        );
      case 'next':
        return (
          <TouchableOpacity onPress={() => onPress(type)}>
            <RightArrowIcon type={'right'} color={'white'} height={18} />
          </TouchableOpacity>
        );
      case 'tabs':
        return (
          <TouchableOpacity onPress={() => onPress(type)}>
            <TabIcon color={'white'} size={24} />
          </TouchableOpacity>
        );
      case 'home':
        return (
          <TouchableOpacity onPress={() => onPress(type)}>
            <HomeIcon color={'white'} size={18} />
          </TouchableOpacity>
        );
      case 'settings':
        return (
          <TouchableOpacity onPress={() => onPress(type)}>
            <ThreeDotsIcon color={'white'} size={18} />
          </TouchableOpacity>
        );
    }
  };

  return (
    <View
      style={[
        {
          bottom: 0,
        },
        style.flatten([
          'width-full',
          'height-80',
          'background-color-text-black-high',
          'flex-row',
          'items-center',
          'padding-40',
          'absolute',
        ]),
      ]}
    >
      {isOpenSetting && (
        <View
          style={{
            backgroundColor: '#132340',
            height: 200,
            width: 200,
            position: 'absolute',
            right: 0,
            bottom: 80,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            zIndex: 1,
            padding: 10,
          }}
        >
          <BrowserSectionModal
            onClose={() => setIsOpenSetting(false)}
            title="Setting"
          />
        </View>
      )}
      <View
        style={style.flatten([
          'width-full',
          'height-80',
          'flex-row',
          'items-center',
        ])}
      >
        {arrayIcon.map((e, i) => {
          return (
            <View key={i} style={{ width: '24%' }}>
              {renderIcon(e)}
            </View>
          );
        })}
      </View>
    </View>
  );
};