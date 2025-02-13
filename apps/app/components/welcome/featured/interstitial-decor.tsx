interface InterstitialDecorProps {
  flip?: boolean;
  opacity?: number;
}

const InterstitialDecor = ({ flip = false, opacity = 1 }: InterstitialDecorProps) => (
  <svg 
    width="231" 
    height="149" 
    viewBox="0 0 231 149" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`absolute right-0 top-1/2 -translate-y-1/2 ${
      flip ? 'scale-y-[-1]' : ''
    }`}
    style={{ opacity }}
  >
    <path d="M421.876 97.0867L256.556 52.1898C247.507 49.7321 237.857 45.5228 228.648 40.0122C219.438 34.5016 211.09 27.9421 204.502 21.043L84.1384 -105" stroke="#4FA26B" strokeWidth="1.5901" strokeMiterlimit="10"/>
    <path d="M350.802 115.088L208.407 75.6545C200.582 73.4902 192.223 69.8162 184.238 65.0382C176.253 60.2603 169 54.5888 163.268 48.6455L58.9561 -59.5386" stroke="#7DC394" strokeWidth="1.5901" strokeMiterlimit="10"/>
    <path d="M282.726 125.953L162.797 93.5349C156.166 91.7422 149.097 88.6645 142.356 84.6309C135.615 80.5974 129.503 75.7923 124.682 70.7323L37.4876 -20.7816" stroke="#AEDDBB" strokeWidth="1.5901" strokeMiterlimit="10"/>
    <path d="M296.376 171L121.252 105.074C115.844 103.574 110.066 101.032 104.549 97.7307C99.0319 94.4297 94.0145 90.5126 90.0513 86.4056L0.876465 -26.5" stroke="#D4EED9" strokeWidth="1.5901" strokeMiterlimit="10"/>
  </svg>
);

export default InterstitialDecor;
