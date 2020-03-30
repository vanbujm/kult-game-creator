import { css } from '@emotion/core';
import 'typeface-gothic-a1';
import 'typeface-nanum-gothic-coding';

export const globalStyles = css`
  html {
    height: 100%;

    font-family: 'Nanum Gothic Coding', Arial, sans-serif;
    background-color: black;
    color: #958c6e;
  }
  body {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: 'Gothic A1', Arial, serif;
    color: #8e2c26;
  }

  #root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    box-sizing: border-box;

    flex: 1;
  }
`;
