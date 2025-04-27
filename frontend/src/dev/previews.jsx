import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import App from "../App.jsx";
import PawsHomepage from "../pages/PawsHomePage.jsx";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/App">
                <App/>
            </ComponentPreview>
            <ComponentPreview path="/PawsHomepage">
                <PawsHomepage/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews