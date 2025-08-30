import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// Use plugin function calls in an array to ensure Next.js receives plugin functions
const config = {
  plugins: [
    tailwindcss(),
    autoprefixer(),
  ],
}

export default config
