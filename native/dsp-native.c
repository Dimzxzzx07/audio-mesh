#include <stdint.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

#define SAMPLE_RATE 48000
#define CARRIER_FREQ 20000
#define BAUD_RATE 100
#define FSK_DEVIATION 500

typedef struct {
    double coeff;
    double q0;
    double q1;
} GoertzelFilter;

EMSCRIPTEN_KEEPALIVE
void init_goertzel(GoertzelFilter* filter, double target_freq, int sample_rate) {
    double k = round(0.5 + (target_freq * sample_rate) / sample_rate);
    double omega = (2.0 * M_PI * k) / sample_rate;
    filter->coeff = 2.0 * cos(omega);
    filter->q0 = 0.0;
    filter->q1 = 0.0;
}

EMSCRIPTEN_KEEPALIVE
double process_goertzel(GoertzelFilter* filter, double sample) {
    double q2 = filter->q1;
    filter->q1 = filter->q0;
    filter->q0 = sample + filter->coeff * filter->q1 - q2;
    return filter->q0 * filter->q0 + filter->q1 * filter->q1 - filter->coeff * filter->q0 * filter->q1;
}

EMSCRIPTEN_KEEPALIVE
void reset_goertzel(GoertzelFilter* filter) {
    filter->q0 = 0.0;
    filter->q1 = 0.0;
}

EMSCRIPTEN_KEEPALIVE
void modulate_fsk(uint8_t* data, int data_len, float* output, int output_len) {
    double samples_per_bit = (double)SAMPLE_RATE / BAUD_RATE;
    int sample_idx = 0;
    double phase = 0.0;
    
    for (int i = 0; i < data_len && sample_idx < output_len; i++) {
        for (int bit = 0; bit < 8 && sample_idx < output_len; bit++) {
            int bit_val = (data[i] >> (7 - bit)) & 1;
            double freq = bit_val ? CARRIER_FREQ + FSK_DEVIATION : CARRIER_FREQ - FSK_DEVIATION;
            double phase_increment = 2.0 * M_PI * freq / SAMPLE_RATE;
            
            for (int s = 0; s < samples_per_bit && sample_idx < output_len; s++) {
                output[sample_idx++] = (float)sin(phase);
                phase += phase_increment;
                if (phase >= 2.0 * M_PI) phase -= 2.0 * M_PI;
            }
        }
    }
}

EMSCRIPTEN_KEEPALIVE
int demodulate_fsk(float* samples, int sample_len, uint8_t* output, int output_len) {
    double samples_per_bit = (double)SAMPLE_RATE / BAUD_RATE;
    GoertzelFilter mark_filter;
    GoertzelFilter space_filter;
    
    init_goertzel(&mark_filter, CARRIER_FREQ + FSK_DEVIATION, SAMPLE_RATE);
    init_goertzel(&space_filter, CARRIER_FREQ - FSK_DEVIATION, SAMPLE_RATE);
    
    int num_bits = (int)(sample_len / samples_per_bit);
    if (num_bits > output_len * 8) num_bits = output_len * 8;
    
    int byte_idx = 0;
    int bit_idx = 0;
    uint8_t current_byte = 0;
    
    for (int bit = 0; bit < num_bits; bit++) {
        int start = (int)(bit * samples_per_bit);
        int end = (int)(start + samples_per_bit);
        if (end > sample_len) end = sample_len;
        
        double mark_energy = 0;
        double space_energy = 0;
        
        reset_goertzel(&mark_filter);
        reset_goertzel(&space_filter);
        
        for (int i = start; i < end; i++) {
            mark_energy += process_goertzel(&mark_filter, samples[i]);
            space_energy += process_goertzel(&space_filter, samples[i]);
        }
        
        int bit_val = (mark_energy > space_energy) ? 1 : 0;
        current_byte |= (bit_val << (7 - bit_idx));
        bit_idx++;
        
        if (bit_idx == 8) {
            if (byte_idx < output_len) {
                output[byte_idx++] = current_byte;
            }
            current_byte = 0;
            bit_idx = 0;
        }
    }
    
    return byte_idx;
}

EMSCRIPTEN_KEEPALIVE
int get_sample_rate() {
    return SAMPLE_RATE;
}

EMSCRIPTEN_KEEPALIVE
int get_carrier_freq() {
    return CARRIER_FREQ;
}

// Required main function for standalone WASM
int main() {
    return 0;
}
