import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AlbumScreen from './screens/AlbumScreen';
import CameraScreen from './screens/CameraScreen';
import ProfileScreen from './screens/ProfileScreen';
// import * as Icon from "react-native-feather";
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Album" component={AlbumScreen} options={{ tabBarIcon: ({ }) => (<View><Icon name="ios-albums" size={30} color="#4F8EF7" /></View>)}} />
        <Tab.Screen name="Camera" component={CameraScreen} options={{ tabBarIcon: ({ }) => (<View><Icon name="ios-camera" size={30} color="#4F8EF7" /></View>)}}/>
        {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

