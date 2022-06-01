///////////////////////////////////////////////////////////////////////////////
// Buscar propiedades en el sitio de una inmobiliaria para alquiler o venta  //
///////////////////////////////////////////////////////////////////////////////

//////////////    Funciones    ///////////////
function ordenaPropiedades(seleccion, orden){
    orden == "A" ? seleccion.sort((a, b) => a.precio - b.precio) : seleccion.sort((a, b) => b.precio - a.precio);
}

function muestraPropiedades(propiedades){
    console.log(propiedades);
    let todas = document.getElementById("todas");
    todas.innerHTML="";
    propiedades.forEach( (propiedad) => {
    // cantidad de dormitorios en singular o plural
        let dormitorios = propiedad.dormitorios == 1 ? " 1 Dormitorio" : propiedad.dormitorios + " Dormitorios";

    // si no tiene cochera --> no dice nada
        let tieneCochera = propiedad.cochera == "conCochera" ? " - Con cochera " : " ";

    // verifico si se publico hace más de 3 meses, entonces el precio esta sujeto a revision
        let {fechaPublicacion} = propiedad;
        let sujetoARevision = (fechaPublicacion.plus({ month: 3 }) <= DateTime.now()) ?
                                "(Sujeto a revisión)" : "";

    // ver cada propiedad con su imagen
        let div = document.createElement("div");
        div.innerHTML = `<div class="row" align="left">
                            <div class="col-sm-4">
                                <div class="well">
                                    <img src=${propiedad.imagen}  class="img-responsive tm-media-img" width="304" height="236"   alt="imagen">
                                </div>
                            </div>  
                            <div class="col-sm-8" height="100%">
                                <div class="well">
                                    <h2>  ${propiedad.operacion} </h2>
                                        $ ${propiedad.precio} ${sujetoARevision}<p> </p> 
                                        ${propiedad.tipoProp} -  
                                        ${propiedad.zona} <p></p>
                                        ${dormitorios}  
                                        ${tieneCochera} <p></p>
                                        ${propiedad.observacion}
                                </div>
                            </div>
                        </div>`;
        todas.appendChild(div);
    })
}

//////////// busca propiedades según lo seleccionado por el usuario  /////////////
function buscarPropiedades(propiedades, ordenamiento){
    let sel = document.getElementById("operacion");
    let operacion = sel.options[sel.selectedIndex].value;
    sel = document.getElementById("tipoProp");
    let tipoProp = sel.options[sel.selectedIndex].value;
    sel = document.getElementById("zona");
    let zona = sel.options[sel.selectedIndex].value;
    sel = document.getElementById("dormitorios");
    let dormitorios = sel.options[sel.selectedIndex].value;
    sel = document.getElementById("cochera");
    let cochera = sel.options[sel.selectedIndex].value;
    sel = document.getElementById("precioMaximo");
    let precioMaximo = sel.value;
    let orden = ordenamiento;
     
    // armo el filtro de lo seleccionado por el usuario
    // asigno valor minimo y máximo según cantidad de dormitorios seleccionados por el usuario
    let minDormitorios = 0;
    let maxDormitorios = 0;
    if (parseInt(dormitorios) < 4){        
        minDormitorios = parseInt(dormitorios);
        maxDormitorios = parseInt(dormitorios);
    }else{
        minDormitorios = 4;
        maxDormitorios = 9999;
    }

    const seleccion = propiedades.filter((elem)=>(elem.operacion == operacion) &&
                                            (elem.tipoProp == tipoProp) &&
                                            (elem.zona == zona) &&
                                            (parseInt(elem.dormitorios) >= minDormitorios) &&
                                            (parseInt(elem.dormitorios) <= maxDormitorios) &&        
                                            (elem.cochera == cochera)  &&
                                            (parseInt(elem.precio) <= parseInt(precioMaximo))   
                                            );
    console.log("Propiedades encontradas ordenadas por precio");
    console.log(seleccion);
    if (seleccion.length > 0){
        ordenaPropiedades(seleccion, orden);
        muestraPropiedades(seleccion);
    }else{
        Swal.fire({
            title: 'No se encontraron propiedades con los valores seleccionados',
            text: 'Cambie algún valor y vuelva a intentar',
            icon: 'info',
            confirmButtonText: 'Entendido'
        }) 
        muestraPropiedades(propiedades);
    }
    guardaPreferencias(operacion, tipoProp, zona, dormitorios, cochera, precioMaximo, orden);
}

//////// guardo en el localStorage las preferencias del usuario.  ////////
function guardaPreferencias(operacion, tipoProp, zona, dormitorios, cochera, precioMaximo, orden){
    let preferencia = {
        operacion: operacion,
        tipoProp: tipoProp,
        zona: zona,
        dormitorios: dormitorios,
        cochera: cochera,
        precioMaximo: precioMaximo,
        orden: orden
    }
    let preferenciaJson = JSON.stringify(preferencia);
    localStorage.setItem("preferencia", preferenciaJson);
}


//   verifico que el precio máximo sea mayor que el menor valor disponible para VENTA o ALQUILER
//         en ese caso --> Toast de advertencia
function verificaPrecioMaximo(e){
    let selPrecioMaximo = document.getElementById("precioMaximo");
    let precioMaximo = selPrecioMaximo.value;
  
//  verifico si hay propiedades, para esa operacion, con ese precioMaximo
    let selOperacion = document.getElementById("operacion");
    let operacion = selOperacion.options[selOperacion.selectedIndex].value;
//  obtengo las propiedades con esta operacion seleccionada por el usuario
    const estaOperacion = propiedades.filter((elem)=>(elem.operacion == operacion));

//  obtengo sólo los precios de cada propiedad y encuentro el menor disponible    
    let precios = estaOperacion.map( el => el.precio);
    let menorPrecioDisponible = Math.min(...precios);
 
//  Si no hay propiedades con ese precio Maximo, mensaje de advertencia
    if (parseInt(precioMaximo) < parseInt(menorPrecioDisponible)){
        Toastify({
            text: `No hay propiedades para ${operacion.toUpperCase()}  por menos de $ ${menorPrecioDisponible}`,            
            duration: 3500,
            style: {
              background: "linear-gradient(to left, #6c66df, #6c66df)",
            },
        }).showToast();
    }
}

/// carga todas las propiedades y muestra segun preferencias guardadas en localStorage
///  Si no hay preferencias guardadas --> muestra todas las disponibles
async function cargaPropiedades(propiedades){
    try{
        let response = await fetch("./data.json");
        let data = await response.json();

        data.forEach((propiedad) => {
console.log(propiedad.cochera);
            propiedad.fechaPublicacion = DateTime.fromISO(propiedad.fechaPublicacion);
            propiedades.push(propiedad);
        });
//// busco en localStorage si hay preferencias guardadas
////    si hay preferencias --> va a filtrar y mostrar
////    si no hay preferenc.--> va a mostrar todas las disponibles
        buscaPrefenciasGuardadas() ? buscarPropiedades(propiedades, preferencia.orden) 
                                   : muestraPropiedades(propiedades, "A");
    }
    catch(err){
        console.log('Solicitud fallida', err)
        Swal.fire({
            title: 'Estamos teniendo inconvenientes al cargar las propiedades',
            text: 'Por favor vuelva a intentar en otro momento',
            icon: 'info',
            confirmButtonText: 'Entendido'
        }) 
        muestraPropiedades(propiedades);
    } 
}

function buscaPrefenciasGuardadas(){
    if (!JsonPreferencia){
        return false;
    }else{
        preferencia = JSON.parse(JsonPreferencia);
    ////// asigno al DOM los valores que están en el localStorage  /////
        let selectOperacion = document.getElementById("operacion");
        selectOperacion.value = preferencia.operacion; 
    
        let selectTipoProp = document.getElementById("tipoProp");
        selectTipoProp.value =  preferencia.tipoProp;
    
        let selectZona = document.getElementById("zona");
        selectZona.value =  preferencia.zona;
    
        let selectDormitorio = document.getElementById("dormitorios");
        selectDormitorio.value = preferencia.dormitorios;
    
        let selectCochera = document.getElementById("cochera");
        selectCochera.value = preferencia.cochera;
    
        let inputPrecioMaximo = document.getElementById("precioMaximo");
        inputPrecioMaximo.value = preferencia.precioMaximo;
        return true;
    }
}

//////////////////////////////////////////////////////////////////////////////////
//                            programa principal                                //
//////////////////////////////////////////////////////////////////////////////////
// agrego escuchadores de eventos 
document.getElementById("buscar").addEventListener("click",() => buscarPropiedades(propiedades, "A"));
document.getElementById("ordenAsc").addEventListener("click",() => buscarPropiedades(propiedades, "A"));
document.getElementById("ordenDes").addEventListener("click",() => buscarPropiedades(propiedades, "D"));
document.getElementById("precioMaximo").addEventListener("focusout", verificaPrecioMaximo);
document.getElementById("operacion").addEventListener("focusout", verificaPrecioMaximo);

// defino variables globales y llamo a la carga de propiedades.
const DateTime = luxon.DateTime;
const propiedades = [];
let JsonPreferencia = localStorage.getItem("preferencia");
let preferencia = "";
cargaPropiedades(propiedades);

