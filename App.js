import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
} from 'react-native';
import { accelerometer, magnetometer  } from "react-native-sensors";
const Sound = require('react-native-sound');
let ring = new Sound('sound.mp3', Sound.MAIN_BUNDLE, (error) => (console.log(error)));

export default function App() {
  return (
    <>
      <Main>test</Main>
    </>
  );
};

class Main extends React.Component {
  render() {
    return (
      <>
        <View style={styles.view}>
          
          {!this.searching &&
            <>
              <Text style={styles.text}>Stay Still:</Text>
              <View style={styles.loader}>
                <View style={{width: ((this.data.acc[1].time - this.data.initTime) / this.holdTime).toString() + "%", height: '100%', backgroundColor: '#0f0'}}></View>
              </View>
            </>
          }

          {this.searching &&
            <>
              {this.found &&
                <>
                  <Text>Device Is Near!</Text>
                  <Text>Current: {this.data.mag}</Text>
                  <Text>Average: {this.data.magAvg}</Text>
                  <Text>STD: {this.data.magSTD}</Text>
                </>
              }

              {!this.found &&
                <>
                  <Text>Move around and search for devices</Text>
                </>
              }
            </>
          }

        </View>
        <Button 
          onPress={this.restart}
          title="Restart"
        />
      </>
    )
  }

  setData(obj) {
    this.data = Object.assign(this.data, obj);
    this.forceUpdate();
  } 

  restart() {
    this.searching = false,
    this.found = false,
    this.setData({
      initTime: Date.now(),
      mag: [],
      magAvg: null,
      magSTD: null,
    })
  }

  calcMagInfo() {
    let a = this.data.mag.map(m => Math.sqrt(m.x**2 + m.y**2 + m.z**2))
    let avg = a.reduce((a, b) => (a + b)) / a.length;
    const std = Math.sqrt(a.map(x => Math.pow(x - avg, 2)).reduce((a, b) => (a+b)) / a.length);
    this.setData({magAvg: avg, magSTD: std });
  }

  constructor() {
    super();
    this.restart = this.restart.bind(this)
    this.holdTime = 50,
    this.searching = false,
    this.found = false,
    this.data = {
      initTime: Date.now(),
      acc: [{ x: 0, y: 0, z: 0, time: 0, },{ x: 0, y: 0, z: 0, time: 0, }],
      mag: [],
      magAvg: null,
      magSTD: null,
    }
    const subscriptionAcc = accelerometer.subscribe(({ x, y, z, timestamp }) =>
      {
        if((this.data.acc[1].time - this.data.initTime) / this.holdTime >= 100 && !this.searching) {
          this.searching = true;
          this.calcMagInfo();
        }
        if(!this.searching) {
          if(
            Math.abs(this.data.acc[1].x - x) <= 0.1 ||
            Math.abs(this.data.acc[1].y - y) <= 0.1 ||
            Math.abs(this.data.acc[1].z - z) <= 0.1
          ) {
            this.setData(
              {acc: [this.data.acc[1], { x: x, y: y, z: z, time: Date.now(), }]}
            ) 
          } else {
            this.setData(
              {initTime: Date.now(), acc: [this.data.acc[1], { x: x, y: y, z: z, time: Date.now(), }], mag: []}
            )
          }
        }
      }
    );
    const subscriptionMag = magnetometer.subscribe(({ x, y, z, timestamp }) =>
      {
        if(this.data.magAvg !== null && this.data.magSTD !== null) {
          const avg = Math.sqrt(x**2 + y**2 + z**2);
          this.setData(
            {mag: Math.sqrt(x**2 + y**2 + z**2)}
          )
          let offset = (1.5 + 1.5 * this.data.magSTD)
          if(avg <= this.data.magAvg - offset || avg >= this.data.magAvg + offset) {
            this.found = true;
            ring.play(() => {
              setTimeout(() => {
                ring.stop()
              }, 500)
              
            });
          } else {
            this.found = false;
          }
        } else {
          this.setData(
            {mag: [...this.data.mag, {x:x, y:y, z:z}]}
          )
        }
      }
    );
  }
}

const styles = StyleSheet.create({
  view: {
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
  title: {
    fontSize: 25,
    marginTop: 10,
  },
  loader: {
    // marginHorizontal: 10,
    overflow: 'hidden',
    width: 100,
    height: 10,
    flexGrow: 1,
    borderColor: "#000",
    borderWidth: 2,
    borderStyle: "solid",
  }
});