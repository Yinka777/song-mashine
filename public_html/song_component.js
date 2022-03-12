'use strict';

const e = React.createElement;

class SongComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return React.createElement("div", {
      className: "compContatiner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cover"
    }, /*#__PURE__*/React.createElement("img", {
      src: window.covers[props.i],
      alt: "Cover",
      height: "95%",
      width: "200px"
    })), /*#__PURE__*/React.createElement("div", {
      className: "info"
    }, /*#__PURE__*/React.createElement("div", {
      className: "songTitle"
    }, /*#__PURE__*/React.createElement("h1", null, window.songTitles[props.i])), /*#__PURE__*/React.createElement("div", {
      className: "albumnTitle"
    }, /*#__PURE__*/React.createElement("h3", null, window.albumns[props.i])), /*#__PURE__*/React.createElement("div", {
      className: "artistName"
    }, /*#__PURE__*/React.createElement("h2", null, window.artists[props.i]))));
  }
}

const domContainer = document.querySelector('#song_container');
ReactDOM.render(e(SongComponent), domContainer);