import * as React from "react";
import {
    Platform,
    StatusBar,
    StyleSheet,
    View,
    TextInput,
    Button,
    Alert
} from "react-native";
import { SplashScreen } from "expo";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import BottomTabNavigator from "./navigation/BottomTabNavigator";
import useLinking from "./navigation/useLinking";
import AsyncStorage from "react-native"; //"@react-native-community/async-storage";
//import SignInScreen from "./screens/SignInScreen";

const Stack = createStackNavigator();
const AuthContext = React.createContext();

function SignInScreen() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

    const { signIn } = React.useContext(AuthContext);

    return (
        <View>
            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Sign in" onPress={() => signIn({ username, password })} />
        </View>
    );
}

export default function App(props) {
    const [isLoadingComplete, setLoadingComplete] = React.useState(false);
    const [initialNavigationState, setInitialNavigationState] = React.useState();
    const containerRef = React.useRef();
    const { getInitialState } = useLinking(containerRef);

    // Load any resources or data that we need prior to rendering the app

    React.useEffect(() => {
        async function loadResourcesAndDataAsync() {
            try {
                SplashScreen.preventAutoHide();

                // Load our initial navigation state
                setInitialNavigationState(await getInitialState());

                // Load fonts
                await Font.loadAsync({
                    ...Ionicons.font,
                    "space-mono": require("./assets/fonts/SpaceMono-Regular.ttf")
                });
            } catch (e) {
                // We might want to provide this error information to an error reporting service
                console.warn(e);
            } finally {
                setLoadingComplete(true);
                SplashScreen.hide();
            }
        }
        const bootstrapAsync = async () => {
            let userToken;

            try {
                userToken = await AsyncStorage.getItem("userToken");
            } catch (e) {
                // Restoring token failed
                console.log(e);
            }

            // After restoring token, we may need to validate it in production apps

            // This will switch to the App screen or Auth screen and this loading
            // screen will be unmounted and thrown away.
            dispatch({ type: "RESTORE_TOKEN", token: userToken });
        };

        bootstrapAsync();

        loadResourcesAndDataAsync();
    }, []);

    const [state, dispatch] = React.useReducer(
        (prevState, action) => {
            switch (action.type) {
                case "RESTORE_TOKEN":
                    return {
                        ...prevState,
                        userToken: action.token,
                        isLoading: false
                    };
                case "SIGN_IN":
                    return {
                        ...prevState,
                        isSignout: false,
                        userToken: action.token
                    };
                case "SIGN_OUT":
                    return {
                        ...prevState,
                        isSignout: true,
                        userToken: null
                    };
            }
        },
        {
            isLoading: true,
            isSignout: false,
            userToken: null
        }
    );

    const authContext = React.useMemo(
        () => ({
            signIn: async data => {
                // In a production app, we need to send some data (usually username, password) to server and get a token
                // We will also need to handle errors if sign in failed
                // After getting token, we need to persist the token using `AsyncStorage`
                // In the example, we'll use a dummy token

                // dispatch({ type: "SIGN_IN", token: "dummy-auth-token" });
                console.log(data);
                let res = await fetch(
                    `https://wearablecity.netlify.com/.netlify/functions/users-read-by-ringid?user=${data.username}`
                );
                let resData = await res.json();
                console.log(resData);
                if (!resData.length) {
                    Alert.alert("login failed");
                } else if (resData[0].data.userName === "test") {
                    dispatch({ type: "SIGN_IN", token: "dummy-auth-token" });
                } else {
                    Alert.alert("login failed!");
                }
            },
            signOut: () => dispatch({ type: "SIGN_OUT" }),
            signUp: async data => {
                // In a production app, we need to send user data to server and get a token
                // We will also need to handle errors if sign up failed
                // After getting token, we need to persist the token using `AsyncStorage`
                // In the example, we'll use a dummy token

                dispatch({ type: "SIGN_IN", token: "dummy-auth-token" });
            }
        }),
        []
    );
    const loggedInView = (
        <View style={styles.container}>
            {Platform.OS === "ios" && <StatusBar barStyle="default" />}
            <NavigationContainer
                ref={containerRef}
                initialState={initialNavigationState}
            >
                <Stack.Navigator>
                    <Stack.Screen name="Root" component={BottomTabNavigator} />
                </Stack.Navigator>
            </NavigationContainer>
        </View>
    );
    if (!isLoadingComplete && !props.skipLoadingScreen) {
        return null;
    } else {
        return (
            <NavigationContainer
                ref={containerRef}
                initialState={initialNavigationState}
            >
                <AuthContext.Provider value={authContext}>
                    <Stack.Navigator>
                        {state.userToken == null ? (
                            // No token found, user isn't signed in
                            <Stack.Screen
                                name="SignIn"
                                component={SignInScreen}
                                options={{
                                    title: "Sign in",
                                    // When logging out, a pop animation feels intuitive
                                    // You can remove this if you want the default 'push' animation
                                    animationTypeForReplace: state.isSignout
                                        ? "pop"
                                        : "push"
                                }}
                            />
                        ) : (
                            // User is signed in
                            //<Stack.Screen name="Home" component={HomeScreen} />
                            <Stack.Screen name="Root" component={BottomTabNavigator} />
                        )}
                    </Stack.Navigator>
                </AuthContext.Provider>
            </NavigationContainer>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff"
    }
});
